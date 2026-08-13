const axios = require("axios");

const crypto = require("crypto");

const {
    PAYMENT_GATEWAYS
} = require("../config/constants");


// =================================================
// Paystack Configuration
// =================================================

const PAYSTACK_SECRET_KEY =
    process.env.PAYSTACK_SECRET_KEY;

const PAYSTACK_BASE_URL =
    "https://api.paystack.co";


// =================================================
// Validate Configuration
// =================================================

if (!PAYSTACK_SECRET_KEY) {

    console.warn(
        "WARNING: PAYSTACK_SECRET_KEY is not configured."
    );

}


// =================================================
// Paystack API Request Helper
// =================================================

const paystackRequest = async ({
    method,
    endpoint,
    data = null
}) => {

    try {

        const response =
            await axios({

                method,

                url:
                    `${PAYSTACK_BASE_URL}${endpoint}`,

                headers: {

                    Authorization:
                        `Bearer ${PAYSTACK_SECRET_KEY}`,

                    "Content-Type":
                        "application/json"

                },

                data

            });


        return response.data;

    } catch (err) {

        console.error(
            "Paystack API Error:",
            err.response?.data ||
            err.message
        );


        throw new Error(
            err.response?.data?.message ||
            "Unable to communicate with Paystack."
        );

    }

};


// =====================================================
// Verify Paystack Webhook Signature
// =====================================================

exports.verifyWebhookSignature = ({
    rawBody,
    signature
}) => {

    if (!rawBody) {

        throw new Error(
            "Paystack webhook body is missing."
        );

    }

    if (!signature) {

        throw new Error(
            "Paystack webhook signature is missing."
        );

    }

    if (!PAYSTACK_SECRET_KEY) {

        throw new Error(
            "PAYSTACK_SECRET_KEY is not configured."
        );

    }

    const expectedSignature =
        crypto
            .createHmac(
                "sha512",
                PAYSTACK_SECRET_KEY
            )
            .update(rawBody)
            .digest("hex");


    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );

};

// =================================================
// Initialize Transaction
// =================================================

exports.initializeTransaction =
async ({

    email,

    amount,

    reference,

    currency = "NGN",

    callbackUrl,

    metadata = {}

}) => {

    // =============================================
    // Validate Email
    // =============================================

    if (!email) {

        throw new Error(
            "Customer email is required."
        );

    }


    // =============================================
    // Validate Amount
    // =============================================

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "Payment amount must be greater than zero."
        );

    }


    // =============================================
    // Validate Reference
    // =============================================

    if (!reference) {

        throw new Error(
            "Payment reference is required."
        );

    }


    // =============================================
    // Build Payload
    // =============================================

    const payload = {

        email,

        amount:
            String(amount),

        currency,

        reference,

        metadata

    };


    // =============================================
    // Callback URL
    // =============================================

    if (callbackUrl) {

        payload.callback_url =
            callbackUrl;

    }


    // =============================================
    // Initialize
    // =============================================

    const result =
        await paystackRequest({

            method:
                "POST",

            endpoint:
                "/transaction/initialize",

            data:
                payload

        });


    // =============================================
    // Validate Response
    // =============================================

    if (
        !result ||
        !result.status ||
        !result.data
    ) {

        throw new Error(
            result?.message ||
            "Paystack transaction initialization failed."
        );

    }


    return {

        success: true,

        gateway:
            PAYMENT_GATEWAYS.PAYSTACK,

        authorizationUrl:
            result.data.authorization_url,

        accessCode:
            result.data.access_code,

        reference:
            result.data.reference,

        raw:
            result

    };

};


// =================================================
// Verify Transaction
// =================================================

exports.verifyTransaction =
async (reference) => {

    // =============================================
    // Validate Reference
    // =============================================

    if (!reference) {

        throw new Error(
            "Paystack transaction reference is required."
        );

    }


    // =============================================
    // Verify Transaction
    // =============================================

    const result =
        await paystackRequest({

            method:
                "GET",

            endpoint:
                `/transaction/verify/${encodeURIComponent(reference)}`

        });


    // =============================================
    // Validate API Response
    // =============================================

    if (
        !result ||
        !result.status ||
        !result.data
    ) {

        throw new Error(
            result?.message ||
            "Unable to verify Paystack transaction."
        );

    }


    return {

        success: true,

        transaction:
            result.data,

        status:
            result.data.status,

        reference:
            result.data.reference,

        amount:
            result.data.amount,

        currency:
            result.data.currency,

        channel:
            result.data.channel,

        customer:
            result.data.customer,

        raw:
            result

    };

};