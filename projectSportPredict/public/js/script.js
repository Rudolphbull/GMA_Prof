

window.addEventListener("scroll", () => {

    const navbar =
        document.querySelector(".custom-navbar");

    if (!navbar) return;

    navbar.classList.toggle(

        "scrolled",

        window.scrollY > 50

    );

});


// document.getElementById("now").textContent = new Date().getDate();
const year =
    document.getElementById("year");

if (year) {

    year.textContent =
        new Date().getFullYear();

}





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

    const container = document.getElementById("flashContainer") ||
     document.body;

    container.prepend(flash);

    setTimeout(() => {

        const bsAlert = bootstrap.Alert.getOrCreateInstance(flash);

        bsAlert.close();

    }, 5000);

}

window.showFlash = showFlash;


// =====================================
// Reusable Delete Confirmation Modal
// =====================================

// =====================================
// Reusable Delete Confirmation Modal
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    const deleteModal =
        document.getElementById("deleteModal");

    if (!deleteModal) return;

    const form =
        deleteModal.querySelector("form");

    const message =
        document.getElementById("deleteMessage");

    if (!form || !message) return;

    deleteModal.addEventListener(

        "show.bs.modal",

        event => {

            const button =
                event.relatedTarget;

            if (!button) return;

            const deleteUrl =
                button.dataset.deleteUrl;

            const deleteMessage =
                button.dataset.deleteMessage;

            if (deleteUrl) {

                form.action = deleteUrl;

            }

            if (deleteMessage) {

                message.textContent =
                    deleteMessage;

            }

        }

    );

});