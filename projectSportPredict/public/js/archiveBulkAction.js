// =========================================
// Archive Bulk Actions
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "archiveBulkAction.js loaded"
        );


        // =====================================
        // Archive Checkboxes
        // =====================================

        const checkboxes =
            Array.from(
                document.querySelectorAll(
                    ".archive-checkbox[data-bulk-checkbox]"
                )
            );


        // =====================================
        // Select All Controls
        // =====================================

        const selectAllTop =
            document.getElementById(
                "selectAllArchives"
            );

        const selectAllHeader =
            document.getElementById(
                "selectAllArchivesHeader"
            );


        // =====================================
        // Bulk Buttons
        // =====================================

        const bulkDeleteButton =
            document.getElementById(
                "bulkDeleteArchivesBtn"
            );

        const bulkRestoreButton =
            document.getElementById(
                "bulkRestoreArchivesBtn"
            );


        // =====================================
        // Selected Count
        // =====================================

        const selectedCount =
            document.getElementById(
                "selectedArchiveCount"
            );


        // =====================================
        // Bulk Form
        // =====================================

        const bulkForm =
            document.getElementById(
                "archiveBulkActionForm"
            );


        if (!bulkForm) {

            console.warn(
                "archiveBulkAction.js: archiveBulkActionForm not found."
            );

        }


        // =====================================
        // Update Selection State
        // =====================================

        function updateSelectionState() {

            const selected =
                checkboxes.filter(
                    checkbox =>
                        checkbox.checked
                );


            const count =
                selected.length;


            // =================================
            // Selected Count
            // =================================

            if (selectedCount) {

                if (count > 0) {

                    selectedCount.textContent =
                        `${count} Selected`;

                    selectedCount.classList.remove(
                        "d-none"
                    );

                } else {

                    selectedCount.classList.add(
                        "d-none"
                    );

                }

            }


            // =================================
            // Bulk Delete
            // =================================

            if (bulkDeleteButton) {

                bulkDeleteButton.disabled =
                    count === 0;

            }


            // =================================
            // Bulk Restore
            // =================================

            if (bulkRestoreButton) {

                bulkRestoreButton.disabled =
                    count === 0;

            }


            // =================================
            // Select-All State
            // =================================

            const allSelected =
                checkboxes.length > 0 &&
                count === checkboxes.length;


            const someSelected =
                count > 0 &&
                count < checkboxes.length;


            if (selectAllTop) {

                selectAllTop.checked =
                    allSelected;

                selectAllTop.indeterminate =
                    someSelected;

            }


            if (selectAllHeader) {

                selectAllHeader.checked =
                    allSelected;

                selectAllHeader.indeterminate =
                    someSelected;

            }

        }


        // =====================================
        // Single Archive Action
        // =====================================

        function confirmSingleAction({

            action,

            title,

            message,

            buttonText,

            buttonClass

        }) {

            // =================================
            // Validate Action URL
            // =================================

            if (!action) {

                console.error(
                    "Single archive action URL is missing."
                );

                return;

            }


            // =================================
            // Validate Confirmation Modal
            // =================================

            if (
                typeof window.openDeleteModal !==
                "function"
            ) {

                console.error(
                    "openDeleteModal() is not available."
                );

                return;

            }


            // =================================
            // Create Temporary Form
            // =================================

            const form =
                createActionForm(
                    action,
                    []
                );


            // =================================
            // Open Confirmation Modal
            // =================================

            window.openDeleteModal({

                form,

                title,

                messageText:
                    message,

                itemText:
                    "",

                buttonText,

                buttonClass

            });

        }


        // =====================================
        // Single Restore
        // =====================================

        document
            .querySelectorAll(
                ".archive-restore-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function (event) {

                            event.preventDefault();


                            confirmSingleAction({

                                action:
                                    this.dataset.action,

                                title:
                                    this.dataset.title ||
                                    "Restore Subscription",

                                message:
                                    this.dataset.message ||
                                    "Restore this archived subscription?",

                                buttonText:
                                    this.dataset.button ||
                                    "Restore",

                                buttonClass:
                                    this.dataset.buttonClass ||
                                    "btn-success"

                            });

                        }
                    );

                }
            );


        // =====================================
        // Single Permanent Delete
        // =====================================

        document
            .querySelectorAll(
                ".archive-delete-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function (event) {

                            event.preventDefault();


                            confirmSingleAction({

                                action:
                                    this.dataset.action,

                                title:
                                    this.dataset.title ||
                                    "Permanently Delete Archive",

                                message:
                                    this.dataset.message ||
                                    "Permanently delete this archived subscription? This action cannot be undone.",

                                buttonText:
                                    this.dataset.button ||
                                    "Delete Permanently",

                                buttonClass:
                                    this.dataset.buttonClass ||
                                    "btn-danger"

                            });

                        }
                    );

                }
            );


        // =====================================
        // Set All Checkboxes
        // =====================================

        function setAllCheckboxes(
            checked
        ) {

            checkboxes.forEach(
                checkbox => {

                    checkbox.checked =
                        checked;

                }
            );


            updateSelectionState();

        }


        // =====================================
        // Select All - Top
        // =====================================

        if (selectAllTop) {

            selectAllTop.addEventListener(
                "change",
                function () {

                    setAllCheckboxes(
                        this.checked
                    );

                }
            );

        }


        // =====================================
        // Select All - Header
        // =====================================

        if (selectAllHeader) {

            selectAllHeader.addEventListener(
                "change",
                function () {

                    setAllCheckboxes(
                        this.checked
                    );

                }
            );

        }


        // =====================================
        // Individual Checkboxes
        // =====================================

        checkboxes.forEach(
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    updateSelectionState
                );

            }
        );


        // =====================================
        // Get Selected IDs
        // =====================================

        function getSelectedIds() {

            return checkboxes

                .filter(
                    checkbox =>
                        checkbox.checked
                )

                .map(
                    checkbox =>
                        checkbox.value
                )

                .filter(Boolean);

        }


        // =====================================
        // Create Temporary Action Form
        // =====================================

        function createActionForm(
            action,
            ids = []
        ) {

            const form =
                document.createElement(
                    "form"
                );


            form.method = "POST";

            form.action = action;

            form.style.display = "none";


            // =================================
            // Identify Bulk Action
            // =================================

            if (ids.length) {

                form.dataset.bulkModule =
                    "archives";

            }


            // =================================
            // Add Selected Archive IDs
            // =================================

            ids.forEach(
                id => {

                    const input =
                        document.createElement(
                            "input"
                        );


                    input.type = "hidden";

                    input.name =
                        "archiveIds";

                    input.value =
                        id;


                    form.appendChild(
                        input
                    );

                }
            );


            document.body.appendChild(
                form
            );


            return form;

        }


        // =====================================
        // Open Confirmation Modal
        // =====================================

        function confirmBulkAction({

            action,

            title,

            message,

            buttonText,

            buttonClass,

            ids

        }) {

            if (!ids || !ids.length) {

                console.warn(
                    "No archive records selected."
                );

                return;

            }


            if (
                typeof window.openDeleteModal !==
                "function"
            ) {

                console.error(
                    "openDeleteModal() is not available."
                );

                return;

            }


            const form =
                createActionForm(
                    action,
                    ids
                );


            window.openDeleteModal({

                form,

                title,

                messageText:
                    message,

                itemText:
                    `${ids.length} archived subscription(s)`,

                buttonText,

                buttonClass

            });

        }


        // =====================================
        // Bulk Delete
        // =====================================

        if (bulkDeleteButton) {

            bulkDeleteButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const ids =
                        getSelectedIds();


                    if (!ids.length) {

                        return;

                    }


                    confirmBulkAction({

                        action:
                            "/admin/subscriptions/archive/bulk-delete",

                        title:
                            "Permanently Delete Archives",

                        message:
                            `Permanently delete ${ids.length} archived subscription(s)? This action cannot be undone.`,

                        buttonText:
                            "Delete Permanently",

                        buttonClass:
                            "btn-danger",

                        ids

                    });

                }
            );

        }


        // =====================================
        // Bulk Restore
        // =====================================

        if (bulkRestoreButton) {

            bulkRestoreButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const ids =
                        getSelectedIds();


                    if (!ids.length) {

                        return;

                    }


                    confirmBulkAction({

                        action:
                            "/admin/subscriptions/archive/bulk-restore",

                        title:
                            "Restore Archived Subscriptions",

                        message:
                            `Restore ${ids.length} archived subscription(s)? Each subscription will be returned to the subscriptions list.`,

                        buttonText:
                            "Restore Selected",

                        buttonClass:
                            "btn-success",

                        ids

                    });

                }
            );

        }


        // =====================================
        // Prevent Direct Bulk Form Submission
        // =====================================

        if (bulkForm) {

            bulkForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    console.warn(
                        "Direct archive bulk form submission intercepted."
                    );

                }
            );

        }


        // =====================================
        // Initial State
        // =====================================

        updateSelectionState();

    }
);