const mongoose = require("mongoose");

const {
    SUBSCRIPTION_PLANS,
    PAYMENT_GATEWAYS,
    PAYMENT_METHODS,
    PAYMENT_STATUS
} = require("../config/constants");

const paymentSchema = new mongoose.Schema({

    // =====================================
    // User
    // =====================================

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    // =====================================
    // Related Subscription
    // =====================================

    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        default: null
    },

    // =====================================
    // Payment Gateway
    // =====================================

    gateway: {
        type: String,
        enum: Object.values(PAYMENT_GATEWAYS),
        required: true,
        index: true
    },

    // =====================================
    // Payment Method
    // =====================================

    paymentMethod: {
        type: String,
        enum: Object.values(PAYMENT_METHODS),
        default: PAYMENT_METHODS.OTHER
    },

    // =====================================
    // Internal Payment Reference
    // Example:
    // PP-PAY-20260807-000001
    // =====================================

    reference: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },

    // =====================================
    // Customer Receipt Number
    // Example:
    // PP-RCP-20260807-000001
    // =====================================

    receiptNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        index: true
    },

    // =====================================
    // Gateway Reference
    // =====================================

    gatewayReference: {
        type: String,
        default: "",
        trim: true,
        index: true
    },

    // =====================================
    // Gateway Transaction ID
    // =====================================

    gatewayTransactionId: {
        type: String,
        default: "",
        trim: true,
        index: true
    },

    // =====================================
    // Amount
    // Stored in smallest currency unit.
    //
    // NGN:
    // ₦5,000 = 500000 Kobo
    //
    // USD:
    // $10.50 = 1050 cents
    // =====================================

    amount: {

        type: Number,

        required: true,

        min: 0,

        validate: [

            {
                validator: Number.isInteger,

                message:
                    "Amount must be in the smallest currency unit: kobo or cents"
            },

            {
                validator: function (value) {

                    if (this.currency === "NGN") {

                        return value >= 500000;

                    }

                    return true;

                },

                message:
                    "Minimum NGN payment is ₦5,000"
            }

        ]

    },

    currency: {
        type: String,
        default: "NGN",
        uppercase: true,
        trim: true,
        enum: ["NGN", "USD"],
        required: true
    },

    // =====================================
    // Purchased Subscription
    // =====================================

    planPurchased: {
        type: String,
        enum: Object.values(SUBSCRIPTION_PLANS),
        required: true
    },

    durationPurchased: {
        type: Number,
        required: true,
        min: 1
    },
    

    // =====================================
    // Payment Status
    // =====================================

    status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.PENDING,
        index: true
    },

    isProcessed: {
        type: Boolean,
        default: false
    },

    processedAt: {
        type: Date,
        default: null
    },

    // =====================================
    // Failure Information
    // =====================================

    failureReason: {
        type: String,
        default: "",
        trim: true
    },

    // =====================================
    // Payment Dates
    // =====================================

    paidAt: {
        type: Date,
        default: null
    },

    verifiedAt: {
        type: Date,
        default: null
    },

    refundedAt: {
        type: Date,
        default: null
    },

    // =====================================
    // Customer
    // =====================================

    customerEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },

    // =====================================
    // Refund Information
    // =====================================

    refundReason: {
        type: String,
        default: "",
        trim: true
    },

    // =====================================
    // Raw Gateway Response
    // =====================================

    providerResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
        select: false //don't return by default in queries
    },


    // =====================================
    // Extra Metadata
    // =====================================

    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        select: false
    },

    // =====================================
    // Manual Payments
    // =====================================

    // isManual: {
    //     type: Boolean,
    //     default: false
    // },

    // manualPaymentDetails: {
    //     paymentMethod: {
    //         type: String,
    //         enum: ["BANK_TRANSFER", "POS", "CASH", "CHEQUE"],
    //         required: function() { return this.isManual }
    //     },
    //     referenceNumber: { 
    //         type: String, 
            
    //         trim: true
    //     },

    //     bankName: { 
    //         type: String, 
            
    //         trim: true
    //     },

    //     paidAt: { type: Date },

    //     proofUrl: { type: String },

    //     verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    //     verifiedAt: { type: Date}
    // },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

}, {
    timestamps: true
});

// =====================================
// Indexes
// =====================================

paymentSchema.index({ reference: 1 });

paymentSchema.index({
    user: 1,
    createdAt: -1
});

paymentSchema.index({ status: 1, createdAt: -1 });

paymentSchema.index({
    status: 1,
    gateway: 1
});

paymentSchema.index({
    gateway: 1,
    paymentMethod: 1
});

paymentSchema.index({
    gateway: 1,
    gatewayReference: 1
});

paymentSchema.index({
    gateway: 1,
    gatewayTransactionId: 1
});

paymentSchema.index({
    customerEmail: 1,
    createdAt: -1
});

paymentSchema.index({ customerEmail: 1, status: 1 });
// =====================================
// Virtuals
// =====================================

paymentSchema.virtual("isSuccessful").get(function () {

    return this.status === PAYMENT_STATUS.SUCCESSFUL;

});

paymentSchema.virtual("isPending").get(function () {

    return this.status === PAYMENT_STATUS.PENDING;

});

paymentSchema.virtual("isRefunded").get(function () {

    return this.status === PAYMENT_STATUS.REFUNDED;

});

// =====================================
// Instance Methods
// =====================================

paymentSchema.methods.markSuccessful = function (
    providerResponse = {}
) {

    this.status = PAYMENT_STATUS.SUCCESSFUL;

    this.providerResponse = providerResponse;

    this.paidAt = new Date();

    this.verifiedAt = new Date();

    this.failureReason = "";

    return this.save();

};

paymentSchema.methods.markFailed = function (
    reason = "",
    providerResponse = {}
) {

    this.status = PAYMENT_STATUS.FAILED;

    this.failureReason = reason;

    this.providerResponse = providerResponse;

    return this.save();

};

paymentSchema.methods.markRefunded = function (
    reason = ""
) {

    this.status = PAYMENT_STATUS.REFUNDED;

    this.refundReason = reason;

    this.refundedAt = new Date();

    return this.save();

};

// paymentSchema.methods.markVerified = function(userId) {
//     this.isManual = true;
//     this.manualDetails.verifiedBy = userId;
//     this.manualDetails.verifiedAt = new Date();
//     this.status = PAYMENT_STATUS.SUCCESSFUL;
//     this.paidAt = new Date();
//     return this.save(); 
// }

paymentSchema.methods.toDisplayAmount = function () {
    return ( this.amount / 100 ).toLocaleString('en-NG', {
        style: 'currency',
        currency: this.currency
    });
}

// =====================================
// JSON
// =====================================

paymentSchema.set("toJSON", {

    virtuals: true,

    versionKey: false,

    transform(doc, ret) {

        delete ret.__v;

        return ret;

    }

});

module.exports = mongoose.model(
    "Payment",
    paymentSchema
);

