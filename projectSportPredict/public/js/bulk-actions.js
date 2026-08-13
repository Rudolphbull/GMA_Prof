document.addEventListener("DOMContentLoaded", () => {

    const bulkForm = document.getElementById("bulkActionForm");

    if (!bulkForm) return;

    const bulkAction =
        document.getElementById("bulkAction");

    const selectAll =
        document.getElementById("selectAll");

    const checkboxes =
        document.querySelectorAll("[data-bulk-checkbox]");


    // ============================================
    // Module Configuration
    // ============================================

    const moduleName =
        bulkForm.dataset.module || "predictions";

    const idField =
        bulkForm.dataset.idField || "predictionIds";

    const idsKey =
        `bulk_${moduleName}_ids`;

    const actionKey =
        `bulk_${moduleName}_action`;

    const pendingKey =
        `bulk_${moduleName}_pending`;

    


    // ============================================
    // Clear Completed Bulk Action State
    // ============================================

    const hasSuccessFlash =
        document.querySelector(".alert-success");

    const hasErrorFlash =
        document.querySelector(".alert-danger");

    const hasWarningFlash =
        document.querySelector(".alert-warning");

    const bulkActionPending =
        sessionStorage.getItem(pendingKey) === "true";


    if (bulkActionPending) {

        if (hasSuccessFlash) {

            sessionStorage.removeItem(idsKey);

            sessionStorage.removeItem(actionKey);

            sessionStorage.removeItem(pendingKey);

        } else if (
            hasErrorFlash ||
            hasWarningFlash
        ) {

            // Keep selection/action available for retry.
            sessionStorage.removeItem(pendingKey);

        }

    }

    // ============================================
    // Storage Helpers
    // ============================================

    const getSavedIds = () => {

        try {

            const stored =
                sessionStorage.getItem(idsKey);

            if (!stored) {
                return [];
            }

            const parsed =
                JSON.parse(stored);

            if (!Array.isArray(parsed)) {
                return [];
            }

            // Remove duplicates and ensure strings
            return [
                ...new Set(
                    parsed
                        .map(id => String(id))
                        .filter(Boolean)
                )
            ];

        } catch (error) {

            console.error(
                `Unable to read ${idsKey} from sessionStorage:`,
                error
            );

            return [];

        }

    };


    const saveIds = (ids) => {

        const uniqueIds = [
            ...new Set(
                ids
                    .map(id => String(id))
                    .filter(Boolean)
            )
        ];

        sessionStorage.setItem(
            idsKey,
            JSON.stringify(uniqueIds)
        );

    };


    const clearSelection = () => {

        sessionStorage.removeItem(idsKey);

        sessionStorage.removeItem(actionKey);

        sessionStorage.removeItem(pendingKey);

    };


    // ============================================
    // Restore Saved State
    // ============================================

    let savedIds = getSavedIds();

    const savedIdSet =
        new Set(savedIds);


    // Restore checkboxes visible on THIS page
    checkboxes.forEach(box => {

        box.checked =
            savedIdSet.has(String(box.value));

    });


    // Restore bulk action
    if (bulkAction) {

        bulkAction.value =
            sessionStorage.getItem(actionKey) || "";

    }


    // Restore Select All state
    if (selectAll) {

        selectAll.checked =
            checkboxes.length > 0 &&
            [...checkboxes].every(
                box => box.checked
            );

    }


    // ============================================
    // Select All
    // ============================================

    if (selectAll) {

        selectAll.addEventListener(
            "change",
            () => {

                let ids =
                    getSavedIds();

                const idSet =
                    new Set(ids);


                checkboxes.forEach(box => {

                    const id =
                        String(box.value);


                    box.checked =
                        selectAll.checked;


                    if (selectAll.checked) {

                        idSet.add(id);

                    } else {

                        idSet.delete(id);

                    }

                });


                saveIds(
                    [...idSet]
                );

            }
        );

    }


    // ============================================
    // Individual Checkbox
    // ============================================

    checkboxes.forEach(box => {

        box.addEventListener(
            "change",
            () => {

                const id =
                    String(box.value);

                const ids =
                    getSavedIds();

                const idSet =
                    new Set(ids);


                if (box.checked) {

                    idSet.add(id);

                } else {

                    idSet.delete(id);

                }


                saveIds(
                    [...idSet]
                );


                // Update Select All for current page only
                if (selectAll) {

                    selectAll.checked =
                        checkboxes.length > 0 &&
                        [...checkboxes].every(
                            checkbox =>
                                checkbox.checked
                        );

                }

            }
        );

    });


    // ============================================
    // Remember Bulk Action
    // ============================================

    if (bulkAction) {

        bulkAction.addEventListener(
            "change",
            () => {

                sessionStorage.setItem(
                    actionKey,
                    bulkAction.value
                );

            }
        );

    }


    // ============================================
    // Bulk Submit
    // ============================================

    bulkForm.addEventListener(
        "submit",
        (e) => {

            /*
             * IMPORTANT:
             *
             * Do NOT build the IDs from the
             * checkboxes currently visible on
             * this page.
             *
             * The persistent sessionStorage
             * collection is the source of truth.
             */

            const ids =
                getSavedIds();


            // ========================================
            // Validate Selection
            // ========================================

            if (ids.length === 0) {

                e.preventDefault();

                window.showFlash?.(
                    "Please select at least one record.",
                    "warning"
                );

                return;

            }


            // ========================================
            // Validate Action
            // ========================================

            if (
                !bulkAction ||
                !bulkAction.value
            ) {

                e.preventDefault();

                window.showFlash?.(
                    "Please choose a bulk action.",
                    "warning"
                );

                return;

            }

            
            // ========================================
            // Mark Bulk Action is pending
            // ========================================

            sessionStorage.setItem(
                pendingKey,
                "true"
            );


            // ========================================
            // Remove Existing Hidden IDs
            // ========================================

            bulkForm
                .querySelectorAll(
                    `input[name="${idField}"]`
                )
                .forEach(input => {
                    input.remove();
                });


            // ========================================
            // Add ALL Persisted IDs
            // ========================================

            ids.forEach(id => {

                const hidden =
                    document.createElement("input");

                hidden.type =
                    "hidden";

                hidden.name =
                    idField;

                hidden.value =
                    id;

                bulkForm.appendChild(
                    hidden
                );

            });


            // ========================================
            // Bulk Delete Confirmation
            // ========================================

            if (
                bulkAction.value === "delete"
            ) {

                e.preventDefault();

                window.openDeleteModal({

                    form: bulkForm,

                    title:
                        "Confirm Bulk Delete",

                    messageText:
                        `Are you sure you want to delete ${ids.length} selected record(s)?`,

                    buttonText:
                        "Delete",

                    buttonClass:
                        "btn-danger"

                });

                return;

            }


            // ========================================
            // Non-Delete Actions
            // ========================================
            //
            // The form is now allowed to submit.
            //
            // We deliberately do NOT clear
            // sessionStorage here.
            //
            // Why?
            //
            // The browser is navigating away and
            // the server needs to receive the IDs.
            // Clearing here is unnecessary and
            // makes debugging/recovery harder.
            //
            // The next page can clear the state
            // after a successful operation.
            //
            // ========================================

        }
    );


    // ============================================
    // Expose Optional Clear Helper
    // ============================================
    //
    // This can be called after a confirmed and
    // successful bulk operation if needed.
    //
    // Example:
    //
    // window.clearBulkSelection();
    //
    // ============================================

    window.clearBulkSelection =
        clearSelection;

});