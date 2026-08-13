// =====================================
// Reusable Confirmation Modal
// =====================================
console.log("confirmationModal.js loaded");

(() => {

    const modalElement =
        document.getElementById("deleteModal");

    console.log("Modal Element:", modalElement);

    if (!modalElement) return;

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    const modalTitle =
        document.getElementById("deleteModalTitle");

    const message =
        document.getElementById("deleteMessage");

    const itemName =
        document.getElementById("deleteItemName");

    const confirmBtn =
        document.getElementById("confirmDelete");


    if (
        !modalTitle ||
        !message ||
        !itemName ||
        !confirmBtn
    ) {

        console.warn(
            "Delete modal is missing required elements."
        );

        return;

    }


    // =====================================
    // State
    // =====================================

    let formToSubmit = null;

    let bulkDeleteConfirmed = false;


    // =====================================
    // Get Bulk Storage Keys
    // =====================================

    const getBulkKeys = (form) => {

        if (!form) return null;

        if (form.id !== "bulkActionForm") {
            return null;
        }

        const moduleName =
            form.dataset.module || "predictions";

        return {

            idsKey:
                `bulk_${moduleName}_ids`,

            actionKey:
                `bulk_${moduleName}_action`,

            pendingKey:
                `bulk_${moduleName}_pending`

        };

    };


    // =====================================
    // Open Modal
    // =====================================

    window.openDeleteModal = ({

        form,

        title = "Confirm Action",

        messageText =
            "Are you sure you want to continue?",

        itemText = "",

        buttonText = "Delete",

        buttonClass = "btn-danger"

    }) => {

        if (!form) return;


        formToSubmit = form;

        bulkDeleteConfirmed = false;


        modalTitle.textContent =
            title;

        message.textContent =
            messageText;

        itemName.textContent =
            itemText;


        confirmBtn.className =
            "btn";

        confirmBtn.classList.add(
            ...buttonClass.split(" ")
        );

        confirmBtn.textContent =
            buttonText;


        modal.show();

    };


    // =====================================
    // Individual Delete Forms
    // =====================================

    document
        .querySelectorAll(".delete-form")
        .forEach(form => {

            form.addEventListener(
                "submit",
                e => {

                    console.log(
                        "Delete form intercepted."
                    );

                    e.preventDefault();


                    window.openDeleteModal({

                        form,

                        title:
                            form.dataset.title ||
                            "Confirm Action",

                        messageText:
                            form.dataset.message ||
                            "Are you sure you want to continue?",

                        itemText:
                            form.dataset.item ||
                            "",

                        buttonText:
                            form.dataset.button ||
                            "Delete",

                        buttonClass:
                            form.dataset.buttonClass ||
                            "btn-danger"

                    });

                }
            );

        });


    // =====================================
    // Confirm
    // =====================================

    confirmBtn.addEventListener(
        "click",
        () => {

            if (!formToSubmit) return;


            const form =
                formToSubmit;


            // =================================
            // DEBUG
            // =================================

            console.log(
                "========== DELETE DEBUG =========="
            );

            console.log(
                "Action:",
                form.action
            );

            console.log(
                "Method:",
                form.method
            );

            console.log(
                "Form:",
                form
            );

            console.log(
                "=================================="
            );


            // =================================
            // Bulk Delete
            // =================================

            if (
                form.id === "bulkActionForm"
            ) {

                const keys =
                    getBulkKeys(form);


                if (keys) {

                    /*
                     * IMPORTANT:
                     *
                     * DO NOT remove the selected IDs
                     * or bulk action here.
                     *
                     * They must survive until the
                     * redirected page confirms that
                     * the operation succeeded.
                     */

                    sessionStorage.setItem(
                        keys.pendingKey,
                        "true"
                    );

                    console.log(
                        "Bulk delete confirmed."
                    );

                    console.log(
                        "Selection retained until success."
                    );

                }

                bulkDeleteConfirmed =
                    true;

            }


            formToSubmit = null;

            modal.hide();


            console.log(
                "Submitting form id:",
                form.id
            );

            console.log(
                "Submitting action:",
                form.getAttribute("action")
            );

            console.log(
                "Submitting method:",
                form.getAttribute("method")
            );


            /*
             * Use native submit so the form is sent
             * without triggering the submit listener
             * again.
             */

            HTMLFormElement.prototype.submit.call(
                form
            );

        }
    );


    // =====================================
    // Modal Closed / Cancelled
    // =====================================

    modalElement.addEventListener(
        "hidden.bs.modal",
        () => {

            /*
             * If the modal was closed without
             * confirming a bulk delete, remove
             * only the pending marker.
             *
             * DO NOT remove the selected IDs
             * or selected action.
             */

            if (
                formToSubmit &&
                !bulkDeleteConfirmed
            ) {

                const keys =
                    getBulkKeys(formToSubmit);


                if (keys) {

                    sessionStorage.removeItem(
                        keys.pendingKey
                    );

                    console.log(
                        "Bulk delete cancelled."
                    );

                }

            }


            formToSubmit = null;

            bulkDeleteConfirmed =
                false;


            // =================================
            // Reset Modal
            // =================================

            modalTitle.textContent =
                "Confirm Action";

            message.textContent =
                "";

            itemName.textContent =
                "";

            confirmBtn.className =
                "btn btn-danger";

            confirmBtn.textContent =
                "Delete";

        }
    );

})();