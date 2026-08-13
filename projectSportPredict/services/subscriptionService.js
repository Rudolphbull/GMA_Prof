const User = require("../models/userModel");

const SubscriptionArchive = require("../models/archivedSubscriptionModel");

const Subscription = require("../models/subscriptionModel");

const archiveService = require("./archiveService");


const mongoose = require("mongoose");

const {
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_STATUS,
    SUBSCRIPTION_SOURCES,
    SUBSCRIPTION_CARDS
} = require("../config/constants");


const calculateExpiryDate = (duration = 30) => {

    const startedAt = new Date();

    const expiresAt = new Date(startedAt);

    expiresAt.setDate(
        expiresAt.getDate() + Number(duration)
    );

    return {
        startedAt,
        expiresAt
    };

};


/**
 * =====================================================
 * Get Subscription Duration (Days)
 * =====================================================
 */

const getSubscriptionDuration = (subscription) => {

    if (!subscription?.startedAt || !subscription?.expiresAt) {
        return 30;
    }

    return Math.max(
        1,
        Math.ceil(
            (
                new Date(subscription.expiresAt) -
                new Date(subscription.startedAt)
            ) /
            (1000 * 60 * 60 * 24)
        )
    );

};



/**
 * Synchronize the User subscription snapshot
 *
 * Accepts either:
 *
 * syncUserSubscription(subscriptionDocument)
 *
 * OR
 *
 * syncUserSubscription({
 *     user,
 *     plan,
 *     status,
 *     startedAt,
 *     expiresAt
 * })
 */

/**
 * =====================================================
 * Synchronize User Subscription Snapshot
 * =====================================================
 *
 * Accepts either:
 *
 * syncUserSubscription(subscriptionDocument)
 *
 * OR
 *
 * syncUserSubscription({
 *     user,
 *     plan,
 *     status,
 *     startedAt,
 *     expiresAt
 * })
 */

exports.syncUserSubscription = async (
    subscription,
    session = null
) => {

    if (!subscription || !subscription.user) {
        return null;
    }

    return await User.findByIdAndUpdate(

        subscription.user,

        {

            subscriptionPlan:
                subscription.plan ??
                SUBSCRIPTION_PLANS.FREE,

            subscriptionStatus:
                subscription.status ??
                SUBSCRIPTION_STATUS.INACTIVE,

            subscriptionStartedAt:
                subscription.startedAt ?? null,

            subscriptionExpiresAt:
                subscription.expiresAt ?? null

        },

        {

            new: true,

            runValidators: true,

            session

        }

    );

};


/**
 * =====================================================
 * Save Subscription and Synchronize User Snapshot
 * =====================================================
 */

const saveAndSync = async (subscription) => {

    await subscription.save();

    await exports.syncUserSubscription(subscription);

    return subscription;

};



// =====================================
// Activate Subscription
// =====================================

exports.activateSubscription = async ({

    user,

    plan = SUBSCRIPTION_PLANS.PREMIUM,

    duration = 30,

    // Optional custom dates
    startedAt = null,

    expiresAt = null,

    activatedBy,

    notes = "",

    source = SUBSCRIPTION_SOURCES.MANUAL,

    cardNumber

}) => {

    // =====================================
    // Validate User
    // =====================================

    const existingUser =
        await User.findById(user);

    if (!existingUser) {

        throw new Error(
            "User not found."
        );

    }


    // =====================================
    // Validate Custom Dates
    // =====================================

    if (
        (startedAt && !expiresAt) ||
        (!startedAt && expiresAt)
    ) {

        throw new Error(
            "Both startedAt and expiresAt must be provided together."
        );

    }


    // =====================================
    // Find Existing Subscription
    // =====================================

    let subscription =
        await Subscription.findOne({ user });


    // =====================================
    // Already Active
    // =====================================

    if (
        subscription &&
        subscription.isActive()
    ) {

        return {

            success: true,

            action: "already_active",

            subscription

        };

    }


    // =====================================
    // CREATE NEW SUBSCRIPTION
    // =====================================

    if (!subscription) {

        let subscriptionStartedAt;
        let subscriptionExpiresAt;


        // =====================================
        // Custom Dates
        // =====================================

        if (startedAt && expiresAt) {

            subscriptionStartedAt =
                new Date(startedAt);

            subscriptionExpiresAt =
                new Date(expiresAt);


            if (
                Number.isNaN(
                    subscriptionStartedAt.getTime()
                ) ||
                Number.isNaN(
                    subscriptionExpiresAt.getTime()
                )
            ) {

                throw new Error(
                    "Invalid subscription dates."
                );

            }


            if (
                subscriptionExpiresAt <=
                subscriptionStartedAt
            ) {

                throw new Error(
                    "Expiry date must be after the start date."
                );

            }

        }


        // =====================================
        // Default Duration
        // =====================================

        else {

            const dates =
                calculateExpiryDate(duration);

            subscriptionStartedAt =
                dates.startedAt;

            subscriptionExpiresAt =
                dates.expiresAt;

        }


        // =====================================
        // Create Subscription
        // =====================================

        subscription =
            await Subscription.create({

                user,

                plan,

                status:
                    SUBSCRIPTION_STATUS.ACTIVE,

                source,

                startedAt:
                    subscriptionStartedAt,

                expiresAt:
                    subscriptionExpiresAt,

                activatedBy,

                notes,

                cardNumber:
                
                    cardNumber ||
                    SUBSCRIPTION_CARDS.CARD_ONE

            });


        // =====================================
        // Synchronize User Snapshot
        // =====================================

        await exports.syncUserSubscription(
            subscription
        );


        return {

            success: true,

            action: "created",

            subscription

        };

    }


    // =====================================
    // Existing Subscription Card
    // =====================================

    const effectiveCardNumber =
        cardNumber ||
        subscription.cardNumber;


    if (!effectiveCardNumber) {

        throw new Error(
            "Subscription card number is required."
        );

    }


    // =====================================
    // Existing Subscription State
    // =====================================

    const now = new Date();


    const hasValidExistingDates =
        subscription.startedAt &&
        subscription.expiresAt &&
        new Date(subscription.expiresAt) > now;


    const isSuspended =
        subscription.status ===
        SUBSCRIPTION_STATUS.SUSPENDED;


    // =====================================
    // Determine Activation Dates
    // =====================================

    let subscriptionStartedAt;

    let subscriptionExpiresAt;


    // =====================================
    // Suspended + Still Valid
    // =====================================

    if (
        isSuspended &&
        hasValidExistingDates &&
        !startedAt &&
        !expiresAt
    ) {

        // Preserve the existing subscription period.

        subscriptionStartedAt =
            subscription.startedAt;

        subscriptionExpiresAt =
            subscription.expiresAt;

    }


    // =====================================
    // Custom Dates Supplied
    // =====================================

    else if (
        startedAt &&
        expiresAt
    ) {

        subscriptionStartedAt =
            new Date(startedAt);

        subscriptionExpiresAt =
            new Date(expiresAt);


        if (
            Number.isNaN(
                subscriptionStartedAt.getTime()
            ) ||
            Number.isNaN(
                subscriptionExpiresAt.getTime()
            )
        ) {

            throw new Error(
                "Invalid subscription dates."
            );

        }


        if (
            subscriptionExpiresAt <=
            subscriptionStartedAt
        ) {

            throw new Error(
                "Expiry date must be after the start date."
            );

        }

    }


    // =====================================
    // Expired / Suspended-Expired / Inactive
    // =====================================

    else {

        const dates =
            calculateExpiryDate(duration);

        subscriptionStartedAt =
            dates.startedAt;

        subscriptionExpiresAt =
            dates.expiresAt;

    }


    // =====================================
    // Reactivate Existing Subscription
    // =====================================

    Object.assign(subscription, {

        plan,

        status:
            SUBSCRIPTION_STATUS.ACTIVE,

        source,

        startedAt:
            subscriptionStartedAt,

        expiresAt:
            subscriptionExpiresAt,

        activatedBy,

        notes,

        cardNumber:
            effectiveCardNumber

    });


    // =====================================
    // Save Subscription
    // =====================================

    await subscription.save();


    // =====================================
    // Synchronize User Snapshot
    // =====================================

    await exports.syncUserSubscription(
        subscription
    );


    // =====================================
    // Return Result
    // =====================================

    return {

        success: true,

        action: "activated",

        subscription

    };

};


exports.suspendSubscription = async ({
    user,
    suspendedBy,
    notes = ""
}) => {

    // =====================================
    // Find Subscription
    // =====================================

    let subscription = await Subscription.findOne({
        user
    });

    if (!subscription) {
        throw new Error("Subscription not found.");
    }

    // =====================================
    // Already Suspended
    // =====================================

    if (subscription.status === SUBSCRIPTION_STATUS.SUSPENDED) {

        return {
            success: true,
            action: "already_suspended",
            subscription
        };

    }

    // =====================================
    // Expired Subscription
    // =====================================

    if (subscription.status === SUBSCRIPTION_STATUS.EXPIRED) {

        return {
            success: true,
            action: "already_expired",
            subscription
        };

    }

    // =====================================
    // Inactive Subscription
    // =====================================

    if (subscription.status === SUBSCRIPTION_STATUS.INACTIVE) {

        return {
            success: true,
            action: "already_inactive",
            subscription
        };

    }

    // =====================================
    // Suspend Subscription
    // =====================================

    subscription.status = SUBSCRIPTION_STATUS.SUSPENDED;

    if (suspendedBy) {
        subscription.activatedBy = suspendedBy;
    }

    if (notes) {
        subscription.notes = notes;
    }

    subscription = await saveAndSync(subscription);

    return {

        success: true,

        action: "suspended",

        subscription

    };

};

exports.expireSubscription = async ({ user }) => {

    // =====================================
    // Find Subscription
    // =====================================

    const subscription = await Subscription.findOne({
        user
    });

    if (!subscription) {
        throw new Error("Subscription not found.");
    }

    // =====================================
    // Already Expired
    // =====================================

    if (subscription.status === SUBSCRIPTION_STATUS.EXPIRED) {

        return {
            success: true,
            action: "already_expired",
            subscription
        };

    }

    // =====================================
    // Only ACTIVE subscriptions can expire
    // =====================================

    if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {

        return {
            success: true,
            action: "not_active",
            subscription
        };

    }

    // =====================================
    // Subscription Still Valid
    // =====================================

    if (!subscription.isExpired()) {

        return {
            success: true,
            action: "still_active",
            subscription
        };

    }

    // =====================================
    // Expire Subscription
    // =====================================

    subscription.status = SUBSCRIPTION_STATUS.EXPIRED;

    subscription = await saveAndSync(subscription);

    return {

        success: true,

        action: "expired",

        subscription

    };

};


exports.deleteSubscription = async (
    subscriptionId,
    adminId,
    reason = "Deleted"
) => {

    try {

        if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
            throw new Error("Invalid subscription ID.");
        }

        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
            throw new Error("Subscription not found.");
        }

        // Prevent duplicate archive
        const existingArchive = await SubscriptionArchive.findOne({
            originalSubscriptionId: subscription._id
        });

        if (!existingArchive) {

            await SubscriptionArchive.create({

                originalSubscriptionId: subscription._id,

                user: subscription.user,

                plan: subscription.plan,

                status: subscription.status,

                source: subscription.source,

                startedAt: subscription.startedAt,

                expiresAt: subscription.expiresAt,

                activatedBy: subscription.activatedBy,

                cardNumber: subscription.cardNumber,

                notes: subscription.notes,

                archivedBy: adminId,

                archivedAt: new Date(),

                reason

            });

        }

        await Subscription.deleteOne({
            _id: subscription._id
        });

        await exports.syncUserSubscription({

            user: subscription.user,

            plan: SUBSCRIPTION_PLANS.FREE,

            status: SUBSCRIPTION_STATUS.INACTIVE,

            startedAt: null,

            expiresAt: null

        });

        return {

            success: true,

            message: "Subscription archived successfully."

        };

    } catch (error) {

        console.error("Delete Subscription Error:", error);

        throw error;

    }

};


exports.restoreSubscription = async (

    archiveId,

    restoredBy

) => {

    // =====================================
    // Find Archive
    // =====================================

    const archive = await SubscriptionArchive.findById(

        archiveId

    );

    if (!archive) {

        throw new Error("Archived subscription not found.");

    }

    const existingSubscription = await Subscription.findOne({

        user: archive.user

    });

    if (existingSubscription) {

        throw new Error(

            "User already has a subscription."

        );

    }

    // =====================================
    // Restore Subscription
    // =====================================

    const subscription = await Subscription.create({

        user: archive.user,

        plan: archive.plan,

        status:
        archive.expiresAt > new Date()
            ? archive.status
            : SUBSCRIPTION_STATUS.EXPIRED,

        source: archive.source,

        startedAt: archive.startedAt,

        expiresAt: archive.expiresAt,

        activatedBy: archive.activatedBy,

        notes: archive.notes,

        cardNumber: archive.cardNumber

    });

    // =====================================
    // Sync User Snapshot
    // =====================================

    await exports.syncUserSubscription(subscription);

    // =====================================
    // Remove Archive
    // =====================================

    await archive.deleteOne();

    return subscription;

};


// =====================================
// Renew Subscription
// =====================================
// =====================================
// Renew Subscription
// =====================================

exports.renewSubscription = async ({

    user,

    plan,

    duration = 30,

    renewedBy,

    notes = "",

    source =
        SUBSCRIPTION_SOURCES.MANUAL,

    paymentReference = ""

}) => {

    // =====================================
    // Validate User
    // =====================================

    const existingUser =
        await User.findById(user);

    if (!existingUser) {

        throw new Error(
            "User not found."
        );

    }


    // =====================================
    // Find Subscription
    // =====================================

    const subscription =
        await Subscription.findOne({
            user
        });

    if (!subscription) {

        throw new Error(
            "Subscription not found."
        );

    }


    // =====================================
    // Validate Duration
    // =====================================

    const renewalDuration =
        Number(duration);

    if (
        !Number.isFinite(
            renewalDuration
        ) ||
        renewalDuration <= 0
    ) {

        throw new Error(
            "Renewal duration must be greater than zero."
        );

    }


    // =====================================
    // Active Subscription
    // Extend Existing Expiry
    // =====================================

    if (subscription.isActive()) {

        const expiresAt =
            new Date(
                subscription.expiresAt
            );

        expiresAt.setDate(

            expiresAt.getDate() +
            renewalDuration

        );

        subscription.expiresAt =
            expiresAt;

    }


    // =====================================
    // Expired / Suspended / Inactive
    // Restart Subscription
    // =====================================

    else {

        const {

            startedAt,

            expiresAt

        } =
            calculateExpiryDate(
                renewalDuration
            );

        subscription.startedAt =
            startedAt;

        subscription.expiresAt =
            expiresAt;

        subscription.status =
            SUBSCRIPTION_STATUS.ACTIVE;

    }


    // =====================================
    // Update Subscription Details
    // =====================================

    subscription.source =
        source;

    subscription.activatedBy =
        renewedBy;


    // =====================================
    // Update Plan
    // =====================================

    if (plan) {

        subscription.plan =
            plan;

    }


    // =====================================
    // Update Notes
    // =====================================

    const noteParts = [];

    if (notes) {

        noteParts.push(
            notes
        );

    }

    if (paymentReference) {

        noteParts.push(
            `Payment Ref: ${paymentReference}`
        );

    }

    if (noteParts.length) {

        subscription.notes =
            noteParts.join(" | ");

    }


    // =====================================
    // Save Subscription
    // =====================================

    await subscription.save();


    // =====================================
    // Synchronize User Snapshot
    // =====================================

    await exports.syncUserSubscription(
        subscription
    );


    // =====================================
    // Return Result
    // =====================================

    return {

        success: true,

        action:
            "renewed",

        subscription

    };

};


exports.bulkActivateSubscriptions = async (
    subscriptions,
    activatedBy
) => {

    let created = 0;
    let activated = 0;
    let alreadyActive = 0;
    let failed = 0;

    for (const subscription of subscriptions) {

        try {

            const result =
                await exports.activateSubscription({

                    user: subscription.user,

                    plan: subscription.plan,

                    duration: getSubscriptionDuration(subscription),

                    activatedBy,

                    notes: subscription.notes,

                    source: subscription.source,

                    cardNumber: subscription.cardNumber

                });

            switch (result.action) {

                case "created":
                    created++;
                    break;

                case "activated":
                    activated++;
                    break;

                case "already_active":
                    alreadyActive++;
                    break;

            }

        } catch (error) {

            console.error(
                `Bulk activation failed for user ${subscription.user}:`,
                error
            );

            failed++;

        }

    }

    return {
        created,
        activated,
        alreadyActive,
        failed
    };

};