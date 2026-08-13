const Payment = require("../models/paymentModel");

const paystackService =
    require("../services/paystackService");

const paymentService =
    require("../services/paymentService");

const {
    PAYMENT_GATEWAYS,
    PAYMENT_STATUS
} = require("../config/constants");


// =====================================================
// Configuration
// =====================================================

// For testing you can keep this at 1 minute.
// Production recommendation: 30 minutes.
const PENDING_PAYMENT_TIMEOUT_MINUTES = 1;


// =====================================================
// Expire Pending Paystack Payments
// =====================================================
//
// Responsibilities:
//
// 1. Find stale pending Paystack payments.
// 2. If Paystack reference does not exist,
//    abandon the payment.
// 3. If Paystack reference exists, verify with Paystack.
// 4. If Paystack says SUCCESS:
//       process the payment/subscription.
// 5. If Paystack says FAILED:
//       mark payment failed.
// 6. If Paystack is still pending:
//       abandon after timeout.
// 7. If Paystack cannot be reached:
//       leave payment pending for the next run.
//
// IMPORTANT:
// This function NEVER blindly abandons a payment
// when Paystack verification itself fails.
//

exports.expirePendingPayments =
async () => {

    // =================================================
    // Calculate Cutoff Time
    // =================================================

    const cutoff =
        new Date(
            Date.now() -
            PENDING_PAYMENT_TIMEOUT_MINUTES *
            60 *
            1000
        );


    // =================================================
    // Find Stale Pending Paystack Payments
    // =================================================

    const payments =
        await Payment.find({

            gateway:
                PAYMENT_GATEWAYS.PAYSTACK,

            status:
                PAYMENT_STATUS.PENDING,

            isProcessed:
                false,

            createdAt: {
                $lt: cutoff
            }

        });


    console.log(
        "Paystack pending payments found:",
        payments.length
    );


    // =================================================
    // Nothing To Process
    // =================================================

    if (!payments.length) {

        return {

            success: true,

            checked: 0,

            abandoned: 0,

            failed: 0,

            processed: 0

        };

    }


    // =================================================
    // Counters
    // =================================================

    let abandoned = 0;

    let failed = 0;

    let processed = 0;


    // =================================================
    // Process Each Pending Payment
    // =================================================

    for (const payment of payments) {

        console.log({
            id:
                payment._id,

            reference:
                payment.reference,

            gatewayReference:
                payment.gatewayReference || null,

            gateway:
                payment.gateway,

            status:
                payment.status,

            isProcessed:
                payment.isProcessed,

            createdAt:
                payment.createdAt

        });


        try {

            // =============================================
            // Gateway Reference Validation
            // =============================================
            //
            // A payment may have been created in Prof
            // Predict but Paystack initialization may
            // never have completed.
            //
            // In that case there is nothing to verify
            // against Paystack.
            //

            const gatewayReference =
                String(
                    payment.gatewayReference || ""
                ).trim();


            if (!gatewayReference) {

                payment.status =
                    PAYMENT_STATUS.ABANDONED;

                payment.failureReason =
                    "Paystack payment was not completed.";

                payment.providerResponse = {

                    reason:
                        "No Paystack gateway reference was recorded.",

                    abandonedAt:
                        new Date()

                };


                await payment.save();


                abandoned++;


                console.log(
                    `Payment ${payment.reference} abandoned: no Paystack gateway reference.`
                );


                continue;

            }


            // =============================================
            // Verify Transaction With Paystack
            // =============================================

            const verification =
                await paystackService
                    .verifyTransaction(
                        gatewayReference
                    );


            // =============================================
            // Paystack Reports SUCCESS
            // =============================================

            if (
                verification &&
                verification.success &&
                verification.transaction &&
                verification.transaction.status ===
                    "success"
            ) {

                console.log(
                    `Pending payment ${payment.reference} was actually successful on Paystack.`
                );


                // -----------------------------------------
                // Process Successful Payment
                // -----------------------------------------

                const result =
                    await paymentService
                        .completePayment({

                            paymentId:
                                payment._id,

                            gatewayReference:
                                verification.transaction
                                    .reference,

                            gatewayTransactionId:
                                verification.transaction.id
                                    ? String(
                                        verification
                                            .transaction.id
                                    )
                                    : "",

                            providerResponse:
                                verification.raw,

                            processedBy:
                                payment.user

                        });


                // -----------------------------------------
                // Verify Processing Result
                // -----------------------------------------

                if (
                    !result ||
                    !result.success
                ) {

                    throw new Error(
                        "Successful Paystack payment could not be processed."
                    );

                }


                processed++;


                console.log(
                    `Payment ${payment.reference} successfully processed and subscription updated.`
                );


                continue;

            }


            // =============================================
            // Paystack Reports FAILED
            // =============================================

            if (
                verification &&
                verification.transaction &&
                verification.transaction.status ===
                    "failed"
            ) {

                payment.status =
                    PAYMENT_STATUS.FAILED;

                payment.failureReason =
                    "Paystack transaction failed.";

                payment.providerResponse =
                    verification.raw || {};


                await payment.save();


                failed++;


                console.log(
                    `Payment ${payment.reference} marked as failed.`
                );


                continue;

            }


            // =============================================
            // Paystack Still Pending
            // =============================================
            //
            // The payment has already exceeded our local
            // timeout, therefore we abandon it.
            //
            // IMPORTANT:
            // We only reach this point after Paystack was
            // successfully contacted.
            //

            payment.status =
                PAYMENT_STATUS.ABANDONED;

            payment.failureReason =
                "Payment was not completed within the allowed payment window.";

            payment.providerResponse =
                verification?.raw || {};


            await payment.save();


            abandoned++;


            console.log(
                `Payment ${payment.reference} abandoned: Paystack transaction remained incomplete.`
            );

        } catch (err) {

            // =============================================
            // Verification / Processing Error
            // =============================================
            //
            // IMPORTANT:
            //
            // Do NOT abandon the payment when:
            //
            // - Paystack is unavailable
            // - Network request fails
            // - API temporarily fails
            // - Successful payment processing fails
            //
            // Leave it pending so the next cleanup cycle
            // can safely retry it.
            //

            console.error(
                `Unable to process pending Paystack payment ${payment.reference}:`,
                err.message
            );

        }

    }


    // =================================================
    // Return Cleanup Summary
    // =================================================

    return {

        success: true,

        checked:
            payments.length,

        abandoned,

        failed,

        processed

    };

};