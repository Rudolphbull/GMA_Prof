const express = require("express");

const router = express.Router();

const paymentController =
    require("../controllers/admin/paymentController");


// =========================================
// Paystack Callback
// =========================================

router.get(
    "/paystack/callback",
    paymentController.paystackCallback
);


module.exports = router;