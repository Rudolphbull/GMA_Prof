const express = require("express");

const router = express.Router();

const paymentController =
    require("../controllers/admin/paymentController");


router.post(
    "/paystack/webhook",
    express.raw({
        type: "application/json"
    }),
    paymentController.paystackWebhook
);


module.exports = router;