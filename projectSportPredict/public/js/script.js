

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

