

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

    let currentForm = null;

    deleteButtons.forEach(button => {

        button.addEventListener("click", (e) => {

            e.preventDefault();

            currentForm = button.closest("form");

            deleteItemName.textContent =
                button.dataset.name || "";

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

