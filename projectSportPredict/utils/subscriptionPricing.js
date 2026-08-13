const {
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_PRICING
} = require("../config/constants");


exports.getSubscriptionPrice = ({
    plan,
    duration
}) => {

    const planPricing =
        SUBSCRIPTION_PRICING[plan];

    if (!planPricing) {

        throw new Error(
            `Unsupported subscription plan: ${plan}`
        );

    }


    const price =
        planPricing[duration];

    if (!price) {

        throw new Error(
            `Invalid duration for ${plan} subscription.`
        );

    }


    return price;

};