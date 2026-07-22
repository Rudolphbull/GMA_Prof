

window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".custom-navbar");

    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
});



// document.getElementById("now").textContent = new Date().getDate();

document.getElementById("year").textContent = new Date().getFullYear();



document.addEventListener("DOMContentLoaded", () => {

    const deleteButtons = document.querySelectorAll(".delete-btn");

    if (!deleteButtons.length) return;

    const modalElement = document.getElementById("deleteModal");

    const deleteModal = new bootstrap.Modal(modalElement);

    const confirmDelete = document.getElementById("confirmDelete");

    const deleteItemName = document.getElementById("deleteItemName");

    const bulkAction = document.getElementById("bulkAction");

    const deleteModalTitle = document.getElementById("deleteModalTitle");

    const deleteMessage = document.getElementById("deleteMessage");


    let currentForm = null;


    deleteButtons.forEach(button => {

        button.addEventListener("click", (e) => {

            e.preventDefault();

            currentForm = button.closest("form");

            document.getElementById("deleteModalTitle").textContent =
                "Confirm Delete";

            deleteMessage.textContent =
                "Are you sure you want to delete this record?";

            deleteItemName.textContent =
                button.dataset.name || "";

            confirmDelete.textContent = "Delete";

            deleteModal.show();

        });

    });

    confirmDelete.addEventListener("click", () => {

        if (currentForm) {

            currentForm.submit();

        }

    });

});



document.addEventListener("DOMContentLoaded", () => {

    const alerts = document.querySelectorAll(".alert");

    alerts.forEach(alert => {

        setTimeout(() => {

            const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);

            bsAlert.close();

        }, 5000);

    });

});


function showFlash(message, type = "success") {

    const existingFlash = document.querySelector(".client-flash");

    if (existingFlash) {

        existingFlash.remove();

    }

    const flash = document.createElement("div");

    flash.className = `alert alert-${type} alert-dismissible fade show client-flash`;

    flash.setAttribute("role", "alert");

    flash.innerHTML = `

        ${message}

        <button
            type="button"
            class="btn-close"
            data-bs-dismiss="alert"
        ></button>

    `;

    const container = document.getElementById("flashContainer")
    || document.body;

    container.prepend(flash);

    setTimeout(() => {

        const bsAlert = bootstrap.Alert.getOrCreateInstance(flash);

        bsAlert.close();

    }, 5000);

}

window.showFlash = showFlash;