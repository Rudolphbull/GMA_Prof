const mongoose = require("mongoose");

const {
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_STATUS,
    SUBSCRIPTION_SOURCES,
    SUBSCRIPTION_CARDS
} = require("../config/constants");

const subscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        plan: {
            type: String,
            enum: Object.values(SUBSCRIPTION_PLANS),
            default: SUBSCRIPTION_PLANS.FREE,
            required: true
        },

        status: {
            type: String,
            enum: Object.values(SUBSCRIPTION_STATUS),
            default: SUBSCRIPTION_STATUS.INACTIVE,
            required: true
        },

        source: {
            type: String,
            enum: Object.values(SUBSCRIPTION_SOURCES),
            default: SUBSCRIPTION_SOURCES.MANUAL,
            required: true
        },

        startedAt: {
            type: Date,
            required: true
        },

        expiresAt: {
            type: Date,
            required: true,
            validate: {
                validator(value) {
                    return value > this.startedAt;
                },
                message: "Expiry date must be after the subscription start date."
            }
        },

        activatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        notes: {
            type: String,
            trim: true,
            default: ""
        },

        cardNumber: {
            type: String,
            enum: Object.values(SUBSCRIPTION_CARDS),
            default: SUBSCRIPTION_CARDS.CARD_ONE,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

/**
 * =====================================================
 * Indexes
 * =====================================================
 */

// One subscription per user
subscriptionSchema.index(
    { user: 1 },
    { unique: true }
);

// Useful for admin filtering
subscriptionSchema.index({
    status: 1,
    expiresAt: 1
});

/**
 * =====================================================
 * Instance Methods
 * =====================================================
 */

// Returns true if the subscription has expired
subscriptionSchema.methods.isExpired = function () {
    return new Date() >= this.expiresAt;
};

// Returns true if subscription is active and not expired
subscriptionSchema.methods.isActive = function () {
    return (
        this.status === SUBSCRIPTION_STATUS.ACTIVE &&
        !this.isExpired()
    );
};

// Returns remaining days before expiry
subscriptionSchema.methods.remainingDays = function () {
    return Math.max(
        0,
        Math.ceil(
            (this.expiresAt - new Date()) /
            (1000 * 60 * 60 * 24)
        )
    );
};

/**
 * =====================================================
 * JSON Transformation
 * =====================================================
 */

subscriptionSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model(
    "Subscription",
    subscriptionSchema
);