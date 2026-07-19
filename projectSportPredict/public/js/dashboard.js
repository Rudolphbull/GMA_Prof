document.addEventListener("DOMContentLoaded", () => {

    if (!window.dashboardData) return;

    /* ==========================
       Prediction Status Bar Chart
       ========================== */

    const ctx = document
        .getElementById("predictionStatusChart")
        .getContext("2d");

    new Chart(ctx, {

        type: "bar",

        data: {

            labels: [
                "Won",
                "Lost",
                "Pending",
                "Void",
                "Expired"
            ],

            datasets: [{

                label: "Predictions",

                data: [
                    window.dashboardData.won,
                    window.dashboardData.lost,
                    window.dashboardData.pending,
                    window.dashboardData.void,
                    window.dashboardData.expired
                ],

                backgroundColor: [
                    "#198754",
                    "#dc3545",
                    "#ffc107",
                    "#6c757d",
                    "#212529"
                ],

                borderWidth: 1

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: false

                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {

                        precision: 0

                    }

                }

            }

        }

    });


    /* ==========================
       Free vs Premium Doughnut
       ========================== */

    const typeCanvas = document.getElementById("predictionTypeChart");

    if (typeCanvas) {

        new Chart(typeCanvas, {

            type: "doughnut",

            data: {

                labels: [

                    "Free",

                    "Premium"

                ],

                datasets: [{

                    data: [

                        window.dashboardData.free,

                        window.dashboardData.premium

                    ],

                    backgroundColor: [

                        "#0d6efd",

                        "#ffc107"

                    ],

                    hoverOffset: 12

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                }

            }

        });

    }



    /* ==========================
    User Growth Line Chart
    ========================== */

    const growthCanvas = document.getElementById("userGrowthChart");

    if (growthCanvas) {

        new Chart(growthCanvas, {

            type: "line",

            data: {

                labels: window.dashboardData.growthLabels,

                datasets: [{

                    label: "New Users",

                    data: window.dashboardData.growthData,

                    borderColor: "#198754",

                    backgroundColor: "rgba(25,135,84,0.15)",

                    fill: true,

                    tension: 0.3

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            precision: 0

                        }

                    }

                }

            }

        });

    }



    /* ==========================
    Prediction Trend Chart
    ========================== */

    const trendCanvas = document.getElementById("predictionTrendChart");

    if (trendCanvas) {

        new Chart(trendCanvas, {

            type: "line",

            data: {

                labels: window.dashboardData.predictionGrowthLabels,

                datasets: [{

                    label: "Predictions",

                    data: window.dashboardData.predictionGrowthData,

                    borderColor: "#0d6efd",

                    backgroundColor: "rgba(13,110,253,0.15)",

                    fill: true,

                    tension: 0.3

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            precision: 0

                        }

                    }

                }

            }

        });

    }
});