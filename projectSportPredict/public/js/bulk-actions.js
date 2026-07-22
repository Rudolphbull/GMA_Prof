document.addEventListener("DOMContentLoaded", () => {

    const selectAll = document.getElementById("selectAll");

    const checkboxes = document.querySelectorAll(".prediction-checkbox");

    const bulkForm = document.getElementById("bulkActionForm");

    const bulkAction = document.getElementById("bulkAction");


    // ==========================
    // Select / Deselect All
    // ==========================

    if (selectAll) {

        selectAll.addEventListener("change", () => {

            checkboxes.forEach(box => {

                box.checked = selectAll.checked;

            });

        });

    }


    // ==========================
    // Keep "Select All" in Sync
    // ==========================

    checkboxes.forEach(box => {

        box.addEventListener("change", () => {

            const checked = document.querySelectorAll(
                ".prediction-checkbox:checked"
            );

            if (selectAll) {

                selectAll.checked =
                    checked.length === checkboxes.length;

            }

        });

    });


    // ==========================
    // Bulk Actions
    // ==========================

    if (bulkForm) {

        bulkForm.addEventListener("submit", (e) => {


            // Remove previously created hidden inputs
            bulkForm
                .querySelectorAll("input[name='predictionIds']")
                .forEach(input => input.remove());


            // Get selected predictions
            const selected = document.querySelectorAll(
                ".prediction-checkbox:checked"
            );


            // Nothing selected
            if (selected.length === 0) {

                e.preventDefault();

                window.showFlash(
                    "Please select at least one prediction.",
                    "warning"
                );

                return;

            }


            // Add hidden inputs
            selected.forEach(box => {

                const hidden = document.createElement("input");

                hidden.type = "hidden";

                hidden.name = "predictionIds";

                hidden.value = box.value;

                bulkForm.appendChild(hidden);

            });


            // Confirm only Bulk Delete
            if (bulkAction.value === "delete") {

                const confirmed = confirm(
                    `Are you sure you want to delete ${selected.length} selected prediction(s)?`
                );

                if (!confirmed) {

                    e.preventDefault();

                    return;

                }

            }

        });

    }

});