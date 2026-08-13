
const crypto = require("crypto");

const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
const Subscription = require("../models/subscriptionModel");

const subscriptionService =
    require("./subscriptionService");

const paystackService =
    require("./paystackService");

const {
    PAYMENT_GATEWAYS,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    SUBSCRIPTION_PLANS
} = require("../config/constants");

const {
    getSubscriptionPrice
} = require("../utils/subscriptionPricing");

// =====================================================
// Generate Internal Payment Reference
// =====================================================
//
// Example:
// PP-PAY-20260810-XXXXXXXX
//
// This reference belongs to Prof Predict.
// It is NOT the gateway transaction reference.
//

exports.generateReference = () => {

    const date =
        new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");

    const random =
        crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase();

    return `PP-PAY-${date}-${random}`;

};


exports.generateReceiptNumber = () => {

    const date =
        new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");

    const random =
        crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase();

    return `PP-RCP-${date}-${random}`;
};


// =====================================================
// Create Payment
// =====================================================
//
// Creates a PENDING payment record.
//
// This does NOT activate or renew a subscription.
// The subscription is only affected after the payment
// has been successfully verified/processed.
//

exports.createPayment = async ({

    user,

    amount,

    plan =
        SUBSCRIPTION_PLANS.PREMIUM,

    paymentMethod =
        PAYMENT_METHODS.OTHER,

    gateway =
        PAYMENT_GATEWAYS.MANUAL,

    currency = "NGN",

    duration = 30,

    customerEmail,

    createdBy = null,

    metadata = {}

}) => {

    // =================================================
    // Validate User
    // =================================================

    const existingUser =
        await User.findById(user);

    if (!existingUser) {

        throw new Error(
            "User not found."
        );

    }


    // =================================================
    // Validate Amount
    // =================================================

    const paymentAmount =
        Number(amount);

    if (
        !Number.isFinite(paymentAmount) ||
        paymentAmount <= 0
    ) {

        throw new Error(
            "Payment amount must be greater than zero."
        );

    }


    // =================================================
    // Validate Currency
    // =================================================

    const normalizedCurrency =
        String(currency || "NGN")
            .trim()
            .toUpperCase();

    if (
        !["NGN", "USD"]
            .includes(normalizedCurrency)
    ) {

        throw new Error(
            "Unsupported payment currency."
        );

    }


    // =================================================
    // Minimum NGN Payment
    // =================================================

    if (
        normalizedCurrency === "NGN" &&
        paymentAmount < 5000
    ) {

        throw new Error(
            "Minimum NGN payment is ₦5,000."
        );

    }


    // =================================================
    // Convert To Smallest Currency Unit
    //
    // NGN:
    // ₦5,000 → 500,000 Kobo
    //
    // USD:
    // $10.50 → 1,050 Cents
    // =================================================

    const amountInMinorUnit =
        Math.round(
            paymentAmount * 100
        );


    // =================================================
    // Validate Converted Amount
    // =================================================

    if (
        !Number.isSafeInteger(
            amountInMinorUnit
        ) ||
        amountInMinorUnit <= 0
    ) {

        throw new Error(
            "Invalid payment amount."
        );

    }


    // =================================================
    // Validate Duration
    // =================================================

    const paymentDuration =
        Number(duration);

    if (
        !Number.isFinite(
            paymentDuration
        ) ||
        paymentDuration <= 0
    ) {

        throw new Error(
            "Payment duration must be greater than zero."
        );

    }


    const expectedAmount =
    getSubscriptionPrice({

        plan,
        duration:
            paymentDuration

    });


    if (
        paymentAmount !==
        expectedAmount
    ) {

        throw new Error(
            `Invalid payment amount. ${plan} for ${paymentDuration} days costs ₦${expectedAmount.toLocaleString()}.`
        );

    }


    // =================================================
    // Determine Customer Email
    // =================================================

    const email =
        customerEmail ||
        existingUser.email;

    if (!email) {

        throw new Error(
            "Customer email is required."
        );

    }


    // =================================================
    // Create Payment
    // =================================================

    const payment =
        await Payment.create({

            user,

            subscription: null,

            gateway,

            paymentMethod,

            reference:
                exports.generateReference(),

            amount:
                amountInMinorUnit,

            currency:
                normalizedCurrency,

            planPurchased:
                plan,

            durationPurchased:
                paymentDuration,

            status:
                PAYMENT_STATUS.PENDING,

            isProcessed:
                false,

            customerEmail:
                email,

            metadata,

            createdBy

        });


    return payment;

};



// =====================================================
// Initialize Paystack Payment
// =====================================================
//
// Finds an existing PENDING Prof Predict payment,
// sends it to Paystack for checkout initialization,
// and stores the Paystack reference.
//
// IMPORTANT:
// This does NOT activate or renew a subscription.
// That only happens after successful verification.
//

exports.initializePaystackPayment =
async ({
    paymentId,
    callbackUrl = ""
}) => {

    // =================================================
    // Find Payment
    // =================================================

    const payment =
        await Payment.findById(
            paymentId
        );

    if (!payment) {

        throw new Error(
            "Payment not found."
        );

    }


    // =================================================
    // Validate Gateway
    // =================================================

    if (
        payment.gateway !==
        PAYMENT_GATEWAYS.PAYSTACK
    ) {

        throw new Error(
            "This payment is not a Paystack payment."
        );

    }


    // =================================================
    // Prevent Re-initialization
    // =================================================

    if (payment.isProcessed) {

        throw new Error(
            "This payment has already been processed."
        );

    }


    // =================================================
    // Validate Payment Status
    // =================================================

    if (
        payment.status !==
        PAYMENT_STATUS.PENDING
    ) {

        throw new Error(
            `Payment cannot be initialized because its status is ${payment.status}.`
        );

    }


    // =================================================
    // Validate Customer Email
    // =================================================

    if (!payment.customerEmail) {

        throw new Error(
            "Customer email is required for Paystack payment."
        );

    }


    // =================================================
    // Initialize Paystack Transaction
    // =================================================

    const result =
        await paystackService
            .initializeTransaction({

                email:
                    payment.customerEmail,

                amount:
                    payment.amount,

                reference:
                    payment.reference,

                currency:
                    payment.currency,

                callbackUrl,

                metadata: {

                    paymentId:
                        payment._id.toString(),

                    userId:
                        payment.user.toString(),

                    plan:
                        payment.planPurchased,

                    duration:
                        payment.durationPurchased

                }

            });


    // =================================================
    // Validate Paystack Response
    // =================================================

    if (
        !result ||
        !result.success ||
        !result.reference ||
        !result.authorizationUrl
    ) {

        throw new Error(
            "Paystack transaction initialization failed."
        );

    }


    // =================================================
    // Store Gateway Reference
    // =================================================
    //
    // Paystack normally returns the same reference
    // supplied during initialization.
    //
    // We nevertheless store the returned reference
    // rather than assuming it.

    payment.gatewayReference =
        result.reference;


    // =================================================
    // Store Gateway Response
    // =================================================

    payment.providerResponse = {

        initialization: {

            gateway:
                PAYMENT_GATEWAYS.PAYSTACK,

            reference:
                result.reference,

            accessCode:
                result.accessCode,

            authorizationUrl:
                result.authorizationUrl,

            initializedAt:
                new Date()

        }

    };


    // =================================================
    // Save
    // =================================================

    await payment.save();


    // =================================================
    // Return
    // =================================================

    return {

        success: true,

        payment,

        authorizationUrl:
            result.authorizationUrl,

        accessCode:
            result.accessCode,

        reference:
            result.reference

    };

};



// =====================================================
// Mark Payment Successful
// =====================================================
//
// This function records a successful gateway verification.
//
// IMPORTANT:
// It does NOT mark the payment as processed yet.
// Subscription processing happens separately.
//

exports.markPaymentSuccessful =
    async ({

        paymentId,

        gatewayReference = "",

        gatewayTransactionId = "",

        providerResponse = {}

    }) => {

        const payment =
            await Payment.findById(
                paymentId
            );

        if (!payment) {

            throw new Error(
                "Payment not found."
            );

        }


        // =============================================
        // Already Processed
        // =============================================

        if (payment.isProcessed) {

            return {

                success: true,

                action:
                    "already_processed",

                payment

            };

        }


        // =============================================
        // Already Successful
        // =============================================

        if (
            payment.status ===
            PAYMENT_STATUS.SUCCESSFUL
        ) {

            return {

                success: true,

                action:
                    "already_successful",

                payment

            };

        }


        // =============================================
        // Update Payment
        // =============================================

        payment.status =
            PAYMENT_STATUS.SUCCESSFUL;

        payment.gatewayReference =
            gatewayReference || "";

        payment.gatewayTransactionId =
            gatewayTransactionId || "";

        payment.providerResponse =
            providerResponse || {};

        payment.paidAt =
            new Date();

        payment.verifiedAt =
            new Date();

        payment.failureReason =
            "";


        await payment.save();


        return {

            success: true,

            action:
                "successful",

            payment

        };

    };


// =====================================================
// Process Successful Payment
// =====================================================
//
// This is the critical business operation.
//
// Successful payment
//      ↓
// Create / activate / renew subscription
//      ↓
// Link payment to subscription
//      ↓
// Mark payment processed
//
// We deliberately mark isProcessed ONLY after the
// subscription operation succeeds.
//

exports.processSuccessfulPayment =
    async ({

        paymentId,

        processedBy = null

    }) => {

        // =================================================
        // Find Payment
        // =================================================

        const payment =
            await Payment.findById(
                paymentId
            );

        if (!payment) {

            throw new Error(
                "Payment not found."
            );

        }


        // =================================================
        // Prevent Duplicate Processing
        // =================================================

        if (payment.isProcessed) {

            return {

                success: true,

                action:
                    "already_processed",

                payment,

                subscription:
                    payment.subscription || null

            };

        }


        // =================================================
        // Payment Must Be Successful
        // =================================================

        if (
            payment.status !==
            PAYMENT_STATUS.SUCCESSFUL
        ) {

            throw new Error(
                "Only successful payments can be processed."
            );

        }


        // =================================================
        // Find Existing Subscription
        // =================================================

        const existingSubscription =
            await Subscription.findOne({

                user:
                    payment.user

            });


        let result;


        // =================================================
        // No Existing Subscription
        // =================================================

        if (!existingSubscription) {

            result =
                await subscriptionService
                    .activateSubscription({

                        user:
                            payment.user,

                        plan:
                            payment.planPurchased,

                        duration:
                            payment.durationPurchased,

                        activatedBy:
                            processedBy,

                        source:
                            payment.gateway,

                        notes:
                            `Payment ${payment.reference}`

                    });

        }


        // =================================================
        // Existing Active Subscription
        // =================================================

        else if (
            existingSubscription.isActive()
        ) {

            result =
                await subscriptionService
                    .renewSubscription({

                        user:
                            payment.user,

                        plan:
                            payment.planPurchased,

                        duration:
                            payment.durationPurchased,

                        renewedBy:
                            processedBy,

                        source:
                            payment.gateway,

                        paymentReference:
                            payment.reference

                    });

        }


        // =================================================
        // Suspended / Expired / Inactive
        // =================================================

        else {

            result =
                await subscriptionService
                    .activateSubscription({

                        user:
                            payment.user,

                        plan:
                            payment.planPurchased,

                        duration:
                            payment.durationPurchased,

                        activatedBy:
                            processedBy,

                        source:
                            payment.gateway,

                        notes:
                            `Payment ${payment.reference}`

                    });

        }


        // =================================================
        // Validate Subscription Result
        // =================================================

        if (
            !result ||
            !result.subscription
        ) {

            throw new Error(
                "Subscription could not be created or updated."
            );

        }


        // =================================================
        // Link Payment → Subscription
        // =================================================

        payment.subscription =
            result.subscription._id;

        
        if (!payment.receiptNumber) {

            payment.receiptNumber =
                exports.generateReceiptNumber();

        }


        // =================================================
        // Mark Payment Processed
        // =================================================

        payment.isProcessed =
            true;

        payment.processedAt =
            new Date();


        await payment.save();


        // =================================================
        // Return Result
        // =================================================

        return {

            success: true,

            action:
                result.action,

            payment,

            subscription:
                result.subscription

        };

    };


// =====================================================
// Complete Payment
// =====================================================
//
// Convenience method:
//
// mark successful
//      ↓
// process successful payment
//
// This will be useful for manual verification and later
// gateway verification controllers.
//

exports.completePayment =
    async ({

        paymentId,

        gatewayReference = "",

        gatewayTransactionId = "",

        providerResponse = {},

        processedBy = null

    }) => {

        const successful =
            await exports.markPaymentSuccessful({

                paymentId,

                gatewayReference,

                gatewayTransactionId,

                providerResponse

            });


        return exports.processSuccessfulPayment({

            paymentId:
                successful.payment._id,

            processedBy

        });

    };


// =====================================================
// Fail Payment
// =====================================================

exports.failPayment =
    async (

        paymentId,

        reason = "",

        providerResponse = {}

    ) => {

        const payment =
            await Payment.findById(
                paymentId
            );

        if (!payment) {

            throw new Error(
                "Payment not found."
            );

        }


        // =============================================
        // Already Processed
        // =============================================

        if (payment.isProcessed) {

            throw new Error(
                "Processed payments cannot be marked as failed."
            );

        }


        payment.status =
            PAYMENT_STATUS.FAILED;

        payment.failureReason =
            reason;

        payment.providerResponse =
            providerResponse || {};


        await payment.save();


        return payment;

    };


// =====================================================
// Abandon Payment
// =====================================================

exports.abandonPayment =
    async (paymentId) => {

        const payment =
            await Payment.findById(
                paymentId
            );

        if (!payment) {

            throw new Error(
                "Payment not found."
            );

        }


        if (payment.isProcessed) {

            throw new Error(
                "Processed payments cannot be abandoned."
            );

        }


        payment.status =
            PAYMENT_STATUS.ABANDONED;


        await payment.save();


        return payment;

    };


// =====================================================
// Refund Payment
// =====================================================

exports.refundPayment =
    async (

        paymentId,

        reason = ""

    ) => {

        const payment =
            await Payment.findById(
                paymentId
            );

        if (!payment) {

            throw new Error(
                "Payment not found."
            );

        }


        if (
            payment.status !==
            PAYMENT_STATUS.SUCCESSFUL
        ) {

            throw new Error(
                "Only successful payments can be refunded."
            );

        }


        payment.status =
            PAYMENT_STATUS.REFUNDED;

        payment.refundReason =
            reason;

        payment.refundedAt =
            new Date();


        await payment.save();


        return payment;

    };


// =====================================================
// Verify Payment
// =====================================================
//
// Gateway-specific verification will be implemented
// through Paystack / Flutterwave services.
//

exports.verifyPayment =
    async () => {

        throw new Error(
            "Gateway verification not implemented."
        );

    };


// =====================================================
// Process Webhook
// =====================================================
//
// Gateway-specific webhook processing will be added
// after the payment controller and gateway services
// are established.
//

exports.processWebhook =
    async () => {

        throw new Error(
            "Webhook processor not implemented."
        );

    };

