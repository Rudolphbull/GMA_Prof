const Subscription = require("../models/subscriptionModel");
const SubscriptionArchive = require("../models/archivedSubscriptionModel");

exports.archiveSubscription = async (
    subscriptionId,
    archivedBy,
    reason = "Deleted",
    session = null
) => {

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
        throw new Error("Subscription not found.");
    }

    const existingArchive = await SubscriptionArchive.findOne({
        originalSubscriptionId: subscription._id
    }).session(session);

    if (existingArchive) {
        throw new Error("Subscription has already been archived.");
    }

    const archivedSubscription = 
        await SubscriptionArchive.create([{

            originalSubscriptionId: subscription._id,

            user: subscription.user,

            plan: subscription.plan,

            status: subscription.status,

            source: subscription.source,

            cardNumber: subscription.cardNumber,

            startedAt: subscription.startedAt,

            expiresAt: subscription.expiresAt,

            activatedBy: subscription.activatedBy,

            renewedFrom: subscription.renewedFrom,

            notes: subscription.notes,

            archivedBy,

            reason

        }], {
            session
        });

    return archivedSubscription[0];

};