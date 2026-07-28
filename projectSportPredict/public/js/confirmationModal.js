(() => {

    let formToSubmit = null;

    const modalElement = document.getElementById("deleteModal");

    if (!modalElement) return;

    const modal = new bootstrap.Modal(modalElement);

    const modalTitle = document.getElementById("deleteModalTitle");

    const message = document.getElementById("deleteMessage");

    const itemName = document.getElementById("deleteItemName");

    const confirmBtn = document.getElementById("confirmDelete");


    /**
     * Universal Confirmation Modal
     *
     * Example:
     *
     * openDeleteModal({
     *     form,
     *     title: "Delete Prediction",
     *     messageText: "Are you sure?",
     *     itemText: "Chelsea vs Arsenal",
     *     buttonText: "Delete",
     *     buttonClass: "btn-danger"
     * });
     */

    window.openDeleteModal = ({
        form,
        title = "Confirm Action",
        messageText = "",
        itemText = "",
        buttonText = "Delete",
        buttonClass = "btn-danger"
    }) => {

        formToSubmit = form;

        modalTitle.textContent = title;

        message.textContent = messageText;

        itemName.textContent = itemText;

        // Reset button classes
        confirmBtn.className = `btn ${buttonClass}`;

        confirmBtn.textContent = buttonText;

        modal.show();

    };


    /**
     * Automatically attach confirmation
     * to every delete form.
     */
    document.querySelectorAll(".delete-form").forEach(form => {

        form.addEventListener("submit", function (e) {

            e.preventDefault();

            window.openDeleteModal({

                form,

                title:
                    form.dataset.title ||
                    "Confirm Delete",

                messageText:
                    form.dataset.message ||
                    "Are you sure you want to continue?",

                itemText:
                    form.dataset.item || "",

                buttonText:
                    form.dataset.button ||
                    "Delete",

                buttonClass:
                    form.dataset.buttonClass ||
                    "btn-danger"

            });

        });

    });


    /**
     * Confirm button clicked
     */
    confirmBtn.addEventListener("click", () => {

        if (!formToSubmit) return;

        const form = formToSubmit;

        // Prevent hidden.bs.modal from clearing it first
        formToSubmit = null;

        modal.hide();

        // Native submit (bypasses submit listeners)
        HTMLFormElement.prototype.submit.call(form);

    });
    
    /**
     * Reset modal every time it closes
     */
    modalElement.addEventListener("hidden.bs.modal", () => {

        formToSubmit = null;

        modalTitle.textContent = "Confirm Action";

        message.textContent = "";

        itemName.textContent = "";

        confirmBtn.className = "btn btn-danger";

        confirmBtn.textContent = "Delete";

    });

})();