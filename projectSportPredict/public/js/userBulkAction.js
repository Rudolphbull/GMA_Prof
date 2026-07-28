document.addEventListener("DOMContentLoaded", () => {

    const bulkForm = document.getElementById("bulkActionForm");
    const bulkAction = document.getElementById("bulkAction");
    const selectAll = document.getElementById("selectAll");
    const checkboxes = document.querySelectorAll(".user-checkbox");

    if (!bulkForm) return;

    // ==========================
    // Select All
    // ==========================
    if (selectAll) {

        selectAll.addEventListener("change", () => {

            checkboxes.forEach(box => {

                box.checked = selectAll.checked;

            });

        });

    }

    // ==========================
    // Keep Select All In Sync
    // ==========================
    checkboxes.forEach(box => {

        box.addEventListener("change", () => {

            if (!selectAll) return;

            selectAll.checked =
                document.querySelectorAll(".user-checkbox:checked").length
                === checkboxes.length;

        });

    });

    // ==========================
    // Bulk Submit
    // ==========================
    bulkForm.addEventListener("submit", (e) => {

        const selected =
            document.querySelectorAll(".user-checkbox:checked");

        if (!selected.length) {

            e.preventDefault();

            window.showFlash(
                "Please select at least one User.",
                "warning"
            );

            return;

        }

        if (!bulkAction.value) {

            e.preventDefault();

            window.showFlash(
                "Please choose a bulk action.",
                "warning"
            );

            return;

        }

        if (bulkAction.value === "delete") {

            e.preventDefault();

            window.openDeleteModal({

                form: bulkForm,

                title: "Bulk Delete users",

                messageText:
                    `Are you sure you want to delete ${selected.length} selected user(s)?`,

                buttonText: "Delete",

                buttonClass: "btn-danger"

            });

        }

    });

});