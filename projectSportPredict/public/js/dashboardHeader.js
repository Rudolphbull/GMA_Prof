function updateDashboardClock() {

    const now = new Date();

    document.getElementById("dashboardDate").textContent =
        now.toLocaleDateString("en-NG", {

            weekday: "long",

            year: "numeric",

            month: "long",

            day: "numeric"

        });

    document.getElementById("dashboardTime").textContent =
        now.toLocaleTimeString("en-NG");

}

updateDashboardClock();

setInterval(updateDashboardClock, 1000);