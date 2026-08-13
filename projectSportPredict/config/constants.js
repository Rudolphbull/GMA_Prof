const ROLES = {
    USER: "user",
    ADMIN: "admin",
    SUPERUSER: "superuser"
};

const SUBSCRIPTION_PLANS = {
    FREE: "Free",
    PREMIUM: "Premium",
    VIP: "Vip"
};

const SUBSCRIPTION_PRICING = {

    [SUBSCRIPTION_PLANS.PREMIUM]: {

        30: 5000,
        60: 10000,
        90: 15000

    },

    [SUBSCRIPTION_PLANS.VIP]: {

        30: 15000,
        60: 30000,
        90: 45000

    }

};

const SUBSCRIPTION_STATUS = {
    INACTIVE: "inactive",
    ACTIVE: "active",
    EXPIRED: "expired",
    SUSPENDED: "suspended"
};

const SUBSCRIPTION_SOURCES = {

    MANUAL: "manual",

    PAYSTACK: "paystack",

    FLUTTERWAVE: "flutterwave",

    STRIPE: "stripe"

};


const SUBSCRIPTION_CARDS = {

    CARD_ONE: "cardOne",

    CARD_TWO: "cardTwo",

    CARD_THREE: "cardThree",

    CARD_FOUR: "cardFour",

    CARD_FIVE: "cardFive",

    CARD_SIX: "cardSix"

};

const ARCHIVE_REASONS = {
    EXPIRED: "Expired",
    SUSPENDED: "Suspended",
    DELETED: "Deleted",
    BULK_DELETED: "Bulk Deleted",
    RESTORED: "Restored"
};


// =====================================
// Payment Gateways
// =====================================

const PAYMENT_GATEWAYS = {

    MANUAL: "manual",

    PAYSTACK: "paystack",

    FLUTTERWAVE: "flutterwave",

    STRIPE: "stripe"

};

// =====================================
// Payment Methods
// =====================================

const PAYMENT_METHODS = {

    CARD: "card",

    BANK_TRANSFER: "bank_transfer",

    USSD: "ussd",

    QR: "qr",

    MOBILE_MONEY: "mobile_money",

    WALLET: "wallet",

    APPLE_PAY: "apple_pay",

    GOOGLE_PAY: "google_pay",

    OTHER: "other"

};

// =====================================
// Payment Status
// =====================================

const PAYMENT_STATUS = {

    PENDING: "pending",

    SUCCESSFUL: "successful",

    FAILED: "failed",

    ABANDONED: "abandoned",

    REFUNDED: "refunded"

};


module.exports = {
    ROLES,
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_PRICING,
    SUBSCRIPTION_STATUS,
    SUBSCRIPTION_SOURCES,
    SUBSCRIPTION_CARDS,
    ARCHIVE_REASONS,
    PAYMENT_GATEWAYS,
    PAYMENT_METHODS,
    PAYMENT_STATUS
};