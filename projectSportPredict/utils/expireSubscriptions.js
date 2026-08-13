const Subscription = require("../models/subscriptionModel");
const User = require("../models/userModel");

const {
    SUBSCRIPTION_STATUS,
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_SOURCES,
    SUBSCRIPTION_CARDS
} = require("../config/constants");


module.exports = async function expireSubscriptions() {

    try {

        console.log("========== EXPIRE SUBSCRIPTIONS ==========");
        console.log("Current Time:", new Date());

        const expiredSubscriptions = await Subscription.find({

            status: SUBSCRIPTION_STATUS.ACTIVE,

            expiresAt: {
                $lte: new Date()
            }

        });

        

        expiredSubscriptions.forEach(subscription => {

            console.log({
                id: subscription._id,
                status: subscription.status,
                expiresAt: subscription.expiresAt
            });

        });


        for (const subscription of expiredSubscriptions) {

            subscription.status = SUBSCRIPTION_STATUS.EXPIRED;

            await subscription.save();

            await User.findByIdAndUpdate(

                subscription.user,

                {

                    subscriptionStatus: SUBSCRIPTION_STATUS.EXPIRED,

                    subscriptionPlan: SUBSCRIPTION_PLANS.FREE,

                    subscriptionStartedAt: null,

                    subscriptionExpiresAt: null

                }

            );

        }

        console.log(
            `✓ ${expiredSubscriptions.length} subscription(s) expired automatically.`
        );

    } catch (err) {

        console.error("Auto Expire Error:", err);

    }

};