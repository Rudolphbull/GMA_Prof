const cron = require("node-cron");

const {
    expirePendingPayments
} = require("./expirePendingPayments");


// =====================================================
// Pending Paystack Payment Cleanup
// =====================================================
//
// Runs every 10 minutes.
//
// The service itself only abandons payments older
// than the configured timeout.
//

cron.schedule("*/10 * * * *", async () => {

    console.log(
        "Running pending Paystack payment cleanup..."
    );

    try {

        const result =
            await expirePendingPayments();

        console.log(
            "Pending Payment Cleanup:",
            result
        );

    } catch (err) {

        console.error(
            "Pending Payment Cleanup Error:",
            err
        );

    }

});