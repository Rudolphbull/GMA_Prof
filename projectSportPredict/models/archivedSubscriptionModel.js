const mongoose = require("mongoose");

const {
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_STATUS,
    SUBSCRIPTION_SOURCES,
    SUBSCRIPTION_CARDS
} = require("../config/constants");

const archivedSubscriptionSchema = new mongoose.Schema({

    originalSubscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        required: true,
        unique: true,
        index: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    plan: {
        type: String,
        enum: Object.values(SUBSCRIPTION_PLANS),
        required: true
    },

    status: {
        type: String,
        enum: Object.values(SUBSCRIPTION_STATUS),
        required: true,
        index: true
    },

    source: {
        type: String,
        enum: Object.values(SUBSCRIPTION_SOURCES),
        default: SUBSCRIPTION_SOURCES.MANUAL
    },

    cardNumber: {
        type: String,
        enum: Object.values(SUBSCRIPTION_CARDS),
        required: true
    },

    startedAt: {
        type: Date,
        default: null
    },

    expiresAt: {
        type: Date,
        default: null
    },

    activatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    renewedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
        default: null,
        index: true
    },

    archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    reason: {
        type: String,
        enum: [
            "Expired",
            "Suspended",
            "Deleted",
            "Bulk Deleted",
            "Restored"
        ],
        required: true,
        index: true
    },

    notes: {
        type: String,
        trim: true,
        default: ""
    },

    archivedAt: {
        type: Date,
        default: Date.now,
        index: true
    }

}, {
    timestamps: true
});


archivedSubscriptionSchema.index({
    plan: 1
});


module.exports = mongoose.model(
    "ArchivedSubscription",
    archivedSubscriptionSchema
);