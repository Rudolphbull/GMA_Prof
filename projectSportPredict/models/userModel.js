
const mongoose = require("mongoose");

const {
    ROLES,
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_STATUS
} = require("../config/constants");

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER
    },

    subscriptionPlan: {
        type: String,
        enum: Object.values(SUBSCRIPTION_PLANS),
        default: SUBSCRIPTION_PLANS.FREE
    },

    subscriptionStatus: {
        type: String,
        enum: Object.values(SUBSCRIPTION_STATUS),
        default: SUBSCRIPTION_STATUS.INACTIVE
    },


    subscriptionStartedAt: {

        type: Date,

        default: null

    },

    subscriptionExpiresAt: {
        type: Date,
        default: null
    }

}, {

    timestamps: true

});


// =========================
// Helper Methods
// =========================

userSchema.methods.hasActiveSubscription = function () {

    return (

        this.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE &&

        this.subscriptionStartedAt &&

        this.subscriptionStartedAt <= new Date() &&

        this.subscriptionExpiresAt &&

        this.subscriptionExpiresAt > new Date()

    );

};

userSchema.methods.subscriptionDaysRemaining = function () {

    if (!this.subscriptionExpiresAt) {

        return 0;

    }

    return Math.max(

        0,

        Math.ceil(

            (this.subscriptionExpiresAt - new Date()) /

            (1000 * 60 * 60 * 24)

        )

    );

};

// =========================
// Virtuals
// =========================

userSchema.virtual("isPremium").get(function () {

    return this.hasActiveSubscription();

});

// =========================
// JSON Settings
// =========================

userSchema.set("toJSON", {

    virtuals: true,

    versionKey: false,

    transform(doc, ret) {

        delete ret.__v;

        return ret;

    }

});

// =========================
// Indexes
// =========================

userSchema.index({

    role: 1,

    subscriptionStatus: 1

});



module.exports =
    mongoose.model("User", userSchema);