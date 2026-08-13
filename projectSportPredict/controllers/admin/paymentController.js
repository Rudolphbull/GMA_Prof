const mongoose = require("mongoose");

const paymentService = require("../../services/paymentService");

const paystackService = require("../../services/paystackService");

const Payment = require("../../models/paymentModel");

const User = require("../../models/userModel");

const {
    PAYMENT_STATUS,
    PAYMENT_METHODS,
    PAYMENT_GATEWAYS,
    SUBSCRIPTION_PLANS
} = require("../../config/constants");

const logActivity = require("../../utils/activityLogger");

// =====================================================
// Payment List
// =====================================================

exports.payments = async (req, res) => {


    console.log("========================================");
    console.log("PAYMENTS LIST CONTROLLER HIT");
    console.log("URL:", req.originalUrl);
    console.log("METHOD:", req.method);
    console.log("========================================");



    try {

        const page =
            Math.max(
                1,
                parseInt(req.query.page, 10) || 1
            );

        const limit = 20;

        const skip =
            (page - 1) * limit;

        const search =
            (req.query.search || "").trim();

        const status =
            (req.query.status || "").trim();

        const gateway =
            (req.query.gateway || "").trim();


        // =============================================
        // Build Query
        // =============================================

        const query = {};


        if (search) {

            query.$or = [

                {
                    reference: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    gatewayReference: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    customerEmail: {
                        $regex: search,
                        $options: "i"
                    }
                }

            ];

        }


        if (status) {

            query.status = status;

        }


        if (gateway) {

            query.gateway = gateway;

        }


        // =============================================
        // Fetch Payments
        // =============================================

        const [
            payments,
            total
        ] = await Promise.all([

            Payment.find(query)

                .populate(
                    "user",
                    "username email"
                )

                .populate(
                    "subscription",
                    "plan status startedAt expiresAt"
                )

                .populate(
                    "createdBy",
                    "username"
                )

                .sort({
                    createdAt: -1
                })

                .skip(skip)

                .limit(limit)

                .lean(),

            Payment.countDocuments(query)

        ]);


        const totalPages =
            Math.ceil(total / limit);


        return res.render(
            "admin/payments/payments",
            {

                title:
                    "Payments",

                payments,

                currentPage:
                    page,

                totalPages,

                total,

                search,

                status,

                gateway,

                PAYMENT_STATUS,

                PAYMENT_METHODS,

                PAYMENT_GATEWAYS,

                SUBSCRIPTION_PLANS

            }
        );

    } catch (err) {

        console.error(
            "Payment List Error:",
            err
        );

        req.flash(
            "error",
            "Unable to load payments."
        );

        return res.redirect(
            "/admin/dashboard"
        );

    }

};


// =====================================================
// Payment Details
// =====================================================

exports.paymentDetails = async (req, res) => {

    try {

        const paymentId = req.params.id;

        console.log("=================================");
        console.log("PAYMENT DETAILS ROUTE HIT");
        console.log(
            "req.originalUrl:",
            req.originalUrl
        );
        console.log(
            "req.params:",
            req.params
        );
        console.log(
            "paymentId:",
            paymentId
        );
        console.log("=================================");


        if (
            !mongoose.Types.ObjectId.isValid(
                paymentId
            )
        ) {

            req.flash(
                "error",
                "Invalid payment ID."
            );

            return res.redirect(
                "/admin/payments"
            );

        }


        const payment =
            await Payment.findById(
                paymentId
            )

                .populate(
                    "user",
                    "username email role"
                )

                .populate(
                    "subscription",
                    "plan status startedAt expiresAt source"
                )

                .populate(
                    "createdBy",
                    "username email"
                )

                .lean();


        if (!payment) {

            req.flash(
                "error",
                "Payment not found."
            );

            return res.redirect(
                "/admin/payments"
            );

        }


        return res.render(
            "admin/payments/paymentDetails",
            {

                title:
                    "Payment Details",

                payment,

                PAYMENT_STATUS,

                PAYMENT_METHODS,

                PAYMENT_GATEWAYS,

                SUBSCRIPTION_PLANS

            }
        );

    } catch (err) {

        console.error(
            "Payment Details Error:",
            err
        );

        req.flash(
            "error",
            "Unable to load payment details."
        );

        return res.redirect(
            "/admin/payments"
        );

    }

};

// =====================================================
// Create Payment Form
// =====================================================

exports.createPaymentForm = async (req, res) => {

    try {

        const users = await User.find({
            role: "user"
        })
            .select("username email")
            .sort({
                username: 1
            })
            .lean();

        return res.render(
            "admin/payments/createPayment",
            {

                title:
                    "Create Manual Payment",

                users,

                PAYMENT_STATUS,

                PAYMENT_METHODS,

                PAYMENT_GATEWAYS,

                SUBSCRIPTION_PLANS

            }
        );

    } catch (err) {

        console.error(
            "Create Payment Form Error:",
            err
        );

        req.flash(
            "error",
            "Unable to load payment form."
        );

        return res.redirect(
            "/admin/payments"
        );

    }

};

// =====================================================
// Create Payment
// =====================================================
//
// Creates a PENDING payment only.
// It does NOT activate a subscription.
//

exports.createPayment = async (
    req,
    res
) => {

    try {

        const {

            user,
            amount,
            plan,
            paymentMethod,
            gateway,
            currency,
            duration,
            customerEmail,
            metadata

        } = req.body;


        const payment =
            await paymentService.createPayment({

                user,

                amount:
                    Number(amount),

                plan,

                paymentMethod,

                gateway,

                currency,

                duration:
                    Number(duration),

                customerEmail,

                createdBy:
                    req.session.user._id,

                metadata

            });


        // =============================================
        // Activity Log
        // =============================================

        await logActivity({

            action:
                "Payment Created",

            description:
                `Payment ${payment.reference} created for ${payment.customerEmail}.`,

            icon:
                "bi-credit-card",

            color:
                "primary",

            createdBy:
                req.session.user._id

        });


        req.flash(
            "success",
            "Payment created successfully."
        );


        return res.redirect(
            `/admin/payments/${payment._id}`
        );

    } catch (err) {

        console.error(
            "Create Payment Error:",
            err
        );

        req.flash(
            "error",
            err.message ||
            "Unable to create payment."
        );

        return res.redirect(
            req.body.redirectTo ||
            "/admin/payments"
        );

    }

};


exports.initializePaystackPayment =
async (req, res) => {

    try {

        const result =
            await paymentService
                .initializePaystackPayment({

                    paymentId:
                        req.params.id,

                    callbackUrl:
                        `${req.protocol}://${req.get("host")}/payments/paystack/callback`

                });


        return res.redirect(
            result.authorizationUrl
        );

    } catch (err) {

        console.error(
            "Initialize Paystack Payment Error:",
            err
        );

        req.flash(
            "error",
            err.message ||
            "Unable to initialize Paystack payment."
        );

        return res.redirect(
            `/admin/payments/${req.params.id}`
        );

    }

};


// =====================================================
// Paystack Callback
// =====================================================
//
// Paystack redirects the customer here after checkout.
//
// IMPORTANT:
// The callback reference is NOT trusted by itself.
// We verify the transaction directly with Paystack
// before completing the payment.
//

exports.paystackCallback = async (req, res) => {

    try {

        // =================================================
        // Get Paystack Reference
        // =================================================

        const reference =
            String(
                req.query.reference || ""
            ).trim();


        if (!reference) {

            req.flash(
                "error",
                "Paystack payment reference was not provided."
            );

            return res.redirect(
                "/admin/payments"
            );

        }


        // =================================================
        // Find Prof Predict Payment
        // =================================================

        const payment =
            await Payment.findOne({

                reference

            });


        if (!payment) {

            throw new Error(
                "Payment record could not be found."
            );

        }


        if (
            payment.gateway !== PAYMENT_GATEWAYS.PAYSTACK
        ) {

            throw new Error(
                "This payment is not a Paystack payment."
            );

        }


        // =================================================
        // Prevent Duplicate Processing
        // =================================================

        if (payment.isProcessed) {

            req.flash(
                "success",
                "This payment has already been processed."
            );

            return res.redirect(
                `/admin/payments/${payment._id}`
            );

        }


        // =================================================
        // Verify Transaction Directly With Paystack
        // =================================================

        const verification =
            await paystackService
                .verifyTransaction(
                    reference
                );


        if (
            !verification ||
            !verification.success ||
            !verification.transaction
        ) {

            throw new Error(
                "Unable to verify Paystack transaction."
            );

        }


        const transaction =
            verification.transaction;


        // =================================================
        // Verify Transaction Status
        // =================================================

        if (
            transaction.status !==
            "success"
        ) {

            throw new Error(
                `Paystack transaction was not successful. Status: ${transaction.status}`
            );

        }


        // =================================================
        // Verify Reference
        // =================================================

        if (
            transaction.reference !==
            payment.reference
        ) {

            throw new Error(
                "Paystack reference does not match the payment record."
            );

        }


        // =================================================
        // Verify Amount
        // =================================================

        if (
            Number(transaction.amount) !==
            Number(payment.amount)
        ) {

            throw new Error(
                "Paystack payment amount does not match the payment record."
            );

        }


        // =================================================
        // Verify Currency
        // =================================================

        if (
            String(transaction.currency)
                .toUpperCase() !==
            String(payment.currency)
                .toUpperCase()
        ) {

            throw new Error(
                "Paystack payment currency does not match the payment record."
            );

        }


        // =================================================
        // Complete Payment
        // =================================================

        const result =
            await paymentService.completePayment({

                paymentId:
                    payment._id,

                gatewayReference:
                    transaction.reference,

                gatewayTransactionId:
                    transaction.id
                        ? String(transaction.id)
                        : "",

                providerResponse:
                    verification.raw,

                processedBy:
                    payment.user

            });


        // =================================================
        // Activity Log
        // =================================================

        if (result.success) {

            await logActivity({

                action:
                    "Paystack Payment Completed",

                description:
                    `Paystack payment ${payment.reference} completed successfully.`,

                icon:
                    "bi-check-circle-fill",

                color:
                    "success",

                createdBy:
                    null

            });

        }


        // =================================================
        // Success Message
        // =================================================

        req.flash(
            "success",
            "Paystack payment completed successfully and your subscription has been processed."
        );


        // =================================================
        // Redirect
        // =================================================

        return res.redirect(
            `/admin/payments/${result.payment._id}`
        );


    } catch (err) {

        console.error(
            "Paystack Callback Error:",
            err
        );


        req.flash(
            "error",
            err.message ||
            "Unable to verify Paystack payment."
        );


        // =================================================
        // Attempt To Return To Payment
        // =================================================

        const reference =
            String(
                req.query.reference || ""
            ).trim();


        if (reference) {

            const payment =
                await Payment.findOne({
                    reference
                });


            if (payment) {

                return res.redirect(
                    `/admin/payments/${payment._id}`
                );

            }

        }


        return res.redirect(
            "/admin/payments"
        );

    }

};


// =====================================================
// Process Successful Payment
// =====================================================
//
// Used to recover a successful payment whose subscription
// has not yet been activated.
//
// IMPORTANT:
// This does NOT contact Paystack and does NOT charge
// the customer again.
//

exports.processSuccessfulPayment = async (req, res) => {

    try {

        const payment =
            await Payment.findById(
                req.params.id
            );

        if (!payment) {

            throw new Error(
                "Payment not found."
            );

        }


        // =============================================
        // Payment Must Be Successful
        // =============================================

        if (
            payment.status !==
            PAYMENT_STATUS.SUCCESSFUL
        ) {

            throw new Error(
                "Only successful payments can be processed."
            );

        }


        // =============================================
        // Already Processed
        // =============================================

        if (payment.isProcessed) {

            req.flash(
                "success",
                "This payment has already been processed."
            );

            return res.redirect(
                `/admin/payments/${payment._id}`
            );

        }


        // =============================================
        // Process Existing Successful Payment
        // =============================================

        const result =
            await paymentService
                .processSuccessfulPayment({

                    paymentId:
                        payment._id,

                    processedBy:
                        payment.user

                });


        if (!result || !result.success) {

            throw new Error(
                "Unable to process successful payment."
            );

        }


        // =============================================
        // Activity Log
        // =============================================

        await logActivity({

            action:
                "Successful Payment Processed",

            description:
                `Successful payment ${payment.reference} was processed and the subscription was activated.`,

            icon:
                "bi-check-circle-fill",

            color:
                "success",

            createdBy:
                req.session.user?._id || null

        });


        // =============================================
        // Success
        // =============================================

        req.flash(
            "success",
            "Successful payment processed and subscription activated successfully."
        );


        return res.redirect(
            `/admin/payments/${payment._id}`
        );


    } catch (err) {

        console.error(
            "Process Successful Payment Error:",
            err
        );


        req.flash(
            "error",
            err.message ||
            "Unable to process successful payment."
        );


        return res.redirect(
            `/admin/payments/${req.params.id}`
        );

    }

};

// =====================================================
// Paystack Webhook
// =====================================================

exports.paystackWebhook = async (req, res) => {

    try {

        // =================================================
        // Get Paystack Signature
        // =================================================

        const signature =
            req.headers["x-paystack-signature"];


        if (!signature) {

            console.warn(
                "Paystack webhook rejected: missing signature."
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message: "Missing Paystack signature."
                });

        }


        // =================================================
        // Verify Webhook Signature
        // =================================================

        const isValid =
            paystackService.verifyWebhookSignature({

                rawBody:
                    req.body,

                signature

            });


        if (!isValid) {

            console.warn(
                "Paystack webhook rejected: invalid signature."
            );

            return res
                .status(401)
                .json({
                    success: false,
                    message: "Invalid webhook signature."
                });

        }


        // =================================================
        // Parse Webhook Body
        // =================================================

        const payload =
            JSON.parse(
                req.body.toString("utf8")
            );


        const event =
            payload.event;


        const data =
            payload.data;


        // =================================================
        // Basic Validation
        // =================================================

        if (!event || !data) {

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid Paystack webhook payload."
                });

        }


        // =================================================
        // We Only Process Successful Charges
        // =================================================

        if (
            event !==
            "charge.success"
        ) {

            console.log(
                `Paystack webhook received event: ${event}`
            );

            return res
                .status(200)
                .json({
                    success: true,
                    message:
                        "Event received."
                });

        }


        // =================================================
        // Get Gateway Reference
        // =================================================

        const reference =
            String(
                data.reference || ""
            ).trim();


        if (!reference) {

            console.warn(
                "Paystack webhook received without reference."
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Payment reference missing."
                });

        }


        // =================================================
        // Find Prof Predict Payment
        // =================================================

        const payment =
            await Payment.findOne({

                reference

            });


        if (!payment) {

            console.warn(
                `Paystack webhook payment not found: ${reference}`
            );

            /*
             * We deliberately acknowledge the webhook.
             *
             * Paystack may retry webhooks when it receives
             * an unsuccessful HTTP response.
             *
             * Since we cannot process a payment that does
             * not exist in our database, repeatedly retrying
             * would not help.
             */

            return res
                .status(200)
                .json({
                    success: true,
                    message:
                        "Payment reference not found."
                });

        }


        // =================================================
        // Confirm Gateway
        // =================================================

        if (
            payment.gateway !==
            PAYMENT_GATEWAYS.PAYSTACK
        ) {

            console.warn(
                `Payment ${payment.reference} is not a Paystack payment.`
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Payment gateway mismatch."
                });

        }


        // =================================================
        // Already Processed
        // =================================================

        if (payment.isProcessed) {

            console.log(
                `Paystack webhook ignored: ${payment.reference} already processed.`
            );

            return res
                .status(200)
                .json({
                    success: true,
                    message:
                        "Payment already processed."
                });

        }


        // =================================================
        // Verify Transaction Directly With Paystack
        // =================================================

        const verification =
            await paystackService
                .verifyTransaction(
                    reference
                );


        if (
            !verification ||
            !verification.success ||
            !verification.transaction
        ) {

            throw new Error(
                "Unable to verify Paystack transaction."
            );

        }


        const transaction =
            verification.transaction;


        // =================================================
        // Verify Transaction Status
        // =================================================

        if (
            transaction.status !==
            "success"
        ) {

            console.warn(
                `Paystack transaction ${reference} status: ${transaction.status}`
            );

            return res
                .status(200)
                .json({
                    success: true,
                    message:
                        "Transaction is not successful."
                });

        }


        // =================================================
        // Verify Reference
        // =================================================

        if (
            transaction.reference !==
            payment.reference
        ) {

            throw new Error(
                "Paystack reference does not match payment record."
            );

        }


        // =================================================
        // Verify Amount
        // =================================================

        if (
            Number(transaction.amount) !==
            Number(payment.amount)
        ) {

            throw new Error(
                "Paystack payment amount does not match payment record."
            );

        }


        // =================================================
        // Verify Currency
        // =================================================

        if (
            String(transaction.currency)
                .toUpperCase() !==
            String(payment.currency)
                .toUpperCase()
        ) {

            throw new Error(
                "Paystack payment currency does not match payment record."
            );

        }


        // =================================================
        // Complete Payment
        // =================================================

        const result =
            await paymentService.completePayment({

                paymentId:
                    payment._id,

                gatewayReference:
                    transaction.reference,

                gatewayTransactionId:
                    transaction.id
                        ? String(transaction.id)
                        : "",

                providerResponse:
                    verification.raw,

                /*
                 * There is no logged-in admin here.
                 *
                 * The webhook is being triggered by Paystack.
                 * Your payment service must therefore allow
                 * this trusted server-side processing path.
                 */

                processedBy:
                    payment.user

            });


        // =================================================
        // Success
        // =================================================

        console.log(
            `Paystack webhook processed successfully: ${payment.reference}`
        );


        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Payment processed successfully.",
                paymentId:
                    result.payment._id
            });


    } catch (err) {

        console.error(
            "Paystack Webhook Error:",
            err
        );


        /*
         * Return a non-2xx response when our processing
         * actually failed.
         *
         * This allows Paystack to retry the webhook.
         */

        return res
            .status(500)
            .json({
                success: false,
                message:
                    "Webhook processing failed."
            });

    }

};

// =====================================================
// Complete Payment
// =====================================================
//
// Manual/admin completion.
//
// In the future this same service flow will be called
// after Paystack / Flutterwave verification.
//


exports.completePayment = async (
    req,
    res
) => {

    try {

        const {

            gatewayReference = "",
            gatewayTransactionId = ""

        } = req.body;


        const result =
            await paymentService.completePayment({

                paymentId:
                    req.params.id,

                gatewayReference,

                gatewayTransactionId,

                providerResponse:
                    req.body.providerResponse || {},

                processedBy:
                    req.session.user._id

            });


        // =============================================
        // Activity Log
        // =============================================

        await logActivity({

            action:
                "Payment Completed",

            description:
                `Payment ${result.payment.reference} completed successfully.`,

            icon:
                "bi-check-circle-fill",

            color:
                "success",

            createdBy:
                req.session.user._id

        });


        req.flash(
            "success",
            "Payment completed and subscription processed successfully."
        );


        return res.redirect(
            `/admin/payments/${result.payment._id}`
        );

    } catch (err) {

        console.error(
            "Complete Payment Error:",
            err
        );

        req.flash(
            "error",
            err.message ||
            "Unable to complete payment."
        );

        return res.redirect(
            `/admin/payments/${req.params.id}`
        );

    }

};


// =====================================================
// Fail Payment
// =====================================================

exports.failPayment = async (
    req,
    res
) => {

    try {

        const reason =
            (req.body.reason || "").trim();


        const payment =
            await paymentService.failPayment(

                req.params.id,

                reason,

                req.body.providerResponse || {}

            );


        await logActivity({

            action:
                "Payment Failed",

            description:
                `Payment ${payment.reference} was marked as failed.`,

            icon:
                "bi-x-circle-fill",

            color:
                "danger",

            createdBy:
                req.session.user._id

        });


        req.flash(
            "success",
            "Payment marked as failed."
        );


        return res.redirect(
            `/admin/payments/${payment._id}`
        );

    } catch (err) {

        console.error(
            "Fail Payment Error:",
            err
        );

        req.flash(
            "error",
            err.message ||
            "Unable to mark payment as failed."
        );

        return res.redirect(
            `/admin/payments/${req.params.id}`
        );

    }

};


// =====================================================
// Abandon Payment
// =====================================================

exports.abandonPayment = async (
    req,
    res
) => {

    try {

        const payment =
            await paymentService.abandonPayment(
                req.params.id
            );


        await logActivity({

            action:
                "Payment Abandoned",

            description:
                `Payment ${payment.reference} was abandoned.`,

            icon:
                "bi-dash-circle-fill",

            color:
                "warning",

            createdBy:
                req.session.user._id

        });


        req.flash(
            "success",
            "Payment marked as abandoned."
        );


        return res.redirect(
            `/admin/payments/${payment._id}`
        );

    } catch (err) {

        console.error(
            "Abandon Payment Error:",
            err
        );

        req.flash(
            "error",
            err.message ||
            "Unable to abandon payment."
        );

        return res.redirect(
            `/admin/payments/${req.params.id}`
        );

    }

};


// =====================================================
// Refund Payment
// =====================================================

exports.refundPayment = async (
    req,
    res
) => {

    try {

        const reason =
            (req.body.reason || "").trim();


        const payment =
            await paymentService.refundPayment(

                req.params.id,

                reason

            );


        await logActivity({

            action:
                "Payment Refunded",

            description:
                `Payment ${payment.reference} was refunded.`,

            icon:
                "bi-arrow-counterclockwise",

            color:
                "warning",

            createdBy:
                req.session.user._id

        });


        req.flash(
            "success",
            "Payment refunded successfully."
        );


        return res.redirect(
            `/admin/payments/${payment._id}`
        );

    } catch (err) {

        console.error(
            "Refund Payment Error:",
            err
        );

        req.flash(
            "error",
            err.message ||
            "Unable to refund payment."
        );

        return res.redirect(
            `/admin/payments/${req.params.id}`
        );

    }

};

