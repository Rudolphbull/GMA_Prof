const mongoose = require("mongoose");
const User = require("../../models/userModel");
const Subscription = require("../../models/subscriptionModel");
const logActivity = require("../../utils/activityLogger");
const SubscriptionArchive = require("../../models/archivedSubscriptionModel");
const subscriptionService = require("../../services/subscriptionService");


const expireSubscriptions =
    require("../../utils/expireSubscriptions");


const {
    SUBSCRIPTION_PLANS,
    SUBSCRIPTION_STATUS,
    SUBSCRIPTION_SOURCES,
    SUBSCRIPTION_CARDS,
    ARCHIVE_REASONS
} = require("../../config/constants");



exports.activateSubscription = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            duration = 30,
            plan = SUBSCRIPTION_PLANS.PREMIUM,
            notes = ""
        } = req.body;

        const user = await User.findById(id);

        if (!user) {

            req.flash(
                "error",
                "User not found."
            );

            return res.redirect("back");

        }

        const result =
        await subscriptionService.activateSubscription({

            user: user._id,

            plan,

            duration,

            activatedBy: req.session.user._id,

            notes,

            source: SUBSCRIPTION_SOURCES.MANUAL

        });

        await logActivity({

            action: "Subscription Activated",

            description:
                `${user.username} (${plan}) - ${result.action}`,

            icon: "bi-award-fill",

            color: "success",

            createdBy: req.session.user._id

        });

        let message = "";

        switch (result.action) {

            case "created":
                message = `${user.username}'s subscription was created and activated.`;
                break;

            case "activated":
                message = `${user.username}'s subscription was activated.`;
                break;

            case "already_active":
                message = `${user.username} already has an active subscription.`;
                break;

        }

        req.flash("success", message);

        return res.redirect(
            req.get("Referrer") ||
            "/admin/users"
        );

    } catch (err) {

        console.error(err);

        req.flash(

            "error",

            "Unable to activate subscription."

        );

        return res.redirect(
            req.get("Referrer") ||
            "/admin/users"
        );

    }

};



// =========================================
// List All Subscriptions
// =========================================

exports.subscriptions = async (req, res, next) => {

    try {

        await expireSubscriptions();

        const {

            search = "",

            plan = "",

            status = "",

            source = "",

            page = 1,

            limit = 10

        } = req.query;

        // =====================================
        // Dashboard Statistics
        // =====================================

        const [

            totalSubscriptions,

            activeSubscriptions,

            expiredSubscriptions,

            premiumSubscriptions

        ] = await Promise.all([

            Subscription.countDocuments(),

            Subscription.countDocuments({

                status: SUBSCRIPTION_STATUS.ACTIVE

            }),

            Subscription.countDocuments({

                status: SUBSCRIPTION_STATUS.EXPIRED

            }),

            Subscription.countDocuments({

                plan: {

                    $in: [

                        SUBSCRIPTION_PLANS.PREMIUM,

                        SUBSCRIPTION_PLANS.VIP

                    ]

                }

            })

        ]);

        // =====================================
        // Build Filter
        // =====================================

        const filter = {};

        if (plan) {

            filter.plan = plan;

        }

        if (status) {

            filter.status = status;

        }

        if (source) {

            filter.source = source;

        }

        if (search) {

            const users = await User.find({

                $or: [

                    {

                        username: {

                            $regex: search,

                            $options: "i"

                        }

                    },

                    {

                        email: {

                            $regex: search,

                            $options: "i"

                        }

                    }

                ]

            }).select("_id");

            filter.user = {

                $in: users.map(user => user._id)

            };

        }

        const currentPage = Number(page);

        const pageLimit = Number(limit);

        const total = await Subscription.countDocuments(filter);

        const totalPages = Math.ceil(total / pageLimit);

        const subscriptions = await Subscription.find(filter)

            .populate("user", "username email")

            .populate("activatedBy", "username")

            .sort({

                createdAt: -1

            })

            .skip((currentPage - 1) * pageLimit)

            .limit(pageLimit);

        res.render("admin/subscriptions", {

            pageTitle: "Subscription Management",

            subscriptions,

            totalSubscriptions,

            activeSubscriptions,

            expiredSubscriptions,

            premiumSubscriptions,

            currentPage,

            totalPages,

            search,

            plan,

            limit,

            status,

            source

        });

    } catch (err) {

        next(err);

    }

};



// =========================================
// View Subscription Details
// =========================================

exports.subscriptionDetails = async (req, res, next) => {

    try {

        // =====================================
        // Validate Subscription ID
        // =====================================

        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {

            req.flash(
                "error",
                "Invalid subscription ID."
            );

            return res.redirect(
                "/admin/subscriptions"
            );

        }


        // =====================================
        // Find Subscription
        // =====================================

        const subscription =
            await Subscription.findById(
                req.params.id
            )
            .populate(
                "user",
                "username email role"
            )
            .populate(
                "activatedBy",
                "username email"
            );


        // =====================================
        // Subscription Not Found
        // =====================================

        if (!subscription) {

            req.flash(
                "error",
                "Subscription not found."
            );

            return res.redirect(
                "/admin/subscriptions"
            );

        }


        // =====================================
        // Calculate Current State
        // =====================================

        const now = new Date();

        const isExpired =
            subscription.expiresAt &&
            new Date(subscription.expiresAt) <= now;

        const remainingDays =
            subscription.remainingDays();


        // =====================================
        // Render Details Page
        // =====================================

        return res.render(
            "admin/subscriptionDetails",
            {

                title:
                    "Subscription Details",

                subscription,

                isExpired,

                remainingDays

            }
        );


    } catch (err) {

        console.error(
            "Subscription Details Error:",
            err
        );


        req.flash(
            "error",
            err.message ||
            "Unable to load subscription details."
        );


        return res.redirect(
            "/admin/subscriptions"
        );

    }

};




// =========================================
// Archived Subscriptions
// =========================================

exports.archivedSubscriptions = async (req, res, next) => {

    try {

        const {

            page = 1,

            limit = 10,

            search = "",

            plan = "",

            reason = "",

            sort = "newest",

            dateFrom = "",

            dateTo = ""

        } = req.query;

        // =====================================
        // Build Filter
        // =====================================

        const filter = {};

        // -------------------------------------
        // Search User
        // -------------------------------------

        if (search.trim()) {

            const users = await User.find({

                $or: [

                    {

                        username: {

                            $regex: search,

                            $options: "i"

                        }

                    },

                    {

                        email: {

                            $regex: search,

                            $options: "i"

                        }

                    }

                ]

            }).select("_id");

            filter.user = {

                $in: users.map(user => user._id)

            };

        }

        // -------------------------------------
        // Plan Filter
        // -------------------------------------

        if (plan) {

            filter.plan = plan;

        }

        // -------------------------------------
        // Archive Reason Filter
        // -------------------------------------

        if (reason) {

            filter.reason = reason;

        }

        // -------------------------------------
        // Date Filter
        // -------------------------------------

        if (dateFrom || dateTo) {

            filter.archivedAt = {};

            if (dateFrom) {

                filter.archivedAt.$gte =
                    new Date(dateFrom);

            }

            if (dateTo) {

                const endDate =
                    new Date(dateTo);

                endDate.setHours(

                    23,

                    59,

                    59,

                    999

                );

                filter.archivedAt.$lte =
                    endDate;

            }

        }

        // =====================================
        // Sorting
        // =====================================

        let sortOption = {

            archivedAt: -1

        };

        switch (sort) {

            case "oldest":

                sortOption = {

                    archivedAt: 1

                };

                break;

            case "plan":

                sortOption = {

                    plan: 1,

                    archivedAt: -1

                };

                break;

            case "user":

                sortOption = {

                    user: 1,

                    archivedAt: -1

                };

                break;

            default:

                sortOption = {

                    archivedAt: -1

                };

        }

        // =====================================
        // Pagination
        // =====================================

        const currentPage = Number(page);

        const pageLimit = Number(limit);

        // =====================================
        // Statistics
        // =====================================

        const today = new Date();

        today.setHours(

            0,

            0,

            0,

            0

        );

        const monthStart = new Date(

            today.getFullYear(),

            today.getMonth(),

            1

        );

        const [

            totalArchives,

            deletedToday,

            deletedThisMonth,

            restorableCount,

            total

        ] = await Promise.all([

            SubscriptionArchive.countDocuments(),

            SubscriptionArchive.countDocuments({

                archivedAt: {

                    $gte: today

                }

            }),

            SubscriptionArchive.countDocuments({

                archivedAt: {

                    $gte: monthStart

                }

            }),

            SubscriptionArchive.countDocuments(),

            SubscriptionArchive.countDocuments(filter)

        ]);

        const totalPages = Math.max(

            1,

            Math.ceil(

                total / pageLimit

            )

        );

        // =====================================
        // Fetch Archives
        // =====================================

        const archives =
            await SubscriptionArchive.find(filter)

                .populate(

                    "user",

                    "username email"

                )

                .populate(

                    "activatedBy",

                    "username"

                )

                .populate(

                    "archivedBy",

                    "username"

                )

                .sort(sortOption)

                .skip(

                    (currentPage - 1) *

                    pageLimit

                )

                .limit(pageLimit);

        // =====================================
        // Render
        // =====================================

        res.render(

            "admin/subscriptionArchive",

            {

                pageTitle:

                    "Subscription Archive",

                archives,

                total,

                totalArchives,

                deletedToday,

                deletedThisMonth,

                restorableCount,

                currentPage,

                totalPages,

                limit: pageLimit,

                search,

                plan,

                reason,

                sort,

                dateFrom,

                dateTo,

                SUBSCRIPTION_PLANS,

                ARCHIVE_REASONS

            }

        );

    } catch (err) {

        req.flash(

            "error",

            err.message

        );

        return res.redirect(

            "/admin/subscriptionArchive"

        );

    }

};


// =========================================
// Bulk Permanently Delete Archives
// =========================================

// =========================================
// Bulk Permanently Delete Archives
// =========================================

exports.bulkDeleteArchives = async (req, res) => {

    try {

        let archiveIds = req.body.archiveIds;

        // =====================================
        // Normalize Input
        // =====================================

        if (!Array.isArray(archiveIds)) {

            archiveIds = archiveIds
                ? [archiveIds]
                : [];

        }

        if (!archiveIds.length) {

            req.flash(
                "error",
                "No archived subscriptions were selected."
            );

            return res.redirect(
                "/admin/subscriptions/archive"
            );

        }

        // =====================================
        // Validate ObjectIds
        // =====================================

        const validIds = archiveIds.filter(
            id => mongoose.Types.ObjectId.isValid(id)
        );

        if (!validIds.length) {

            req.flash(
                "error",
                "No valid archive records were selected."
            );

            return res.redirect(
                "/admin/subscriptions/archive"
            );

        }

        // =====================================
        // Load Archives From Database
        // =====================================

        const archives =
            await SubscriptionArchive.find({
                _id: {
                    $in: validIds
                }
            });

        if (!archives.length) {

            req.flash(
                "error",
                "No matching archive records were found."
            );

            return res.redirect(
                "/admin/subscriptions/archive"
            );

        }

        // =====================================
        // Protect Active Archives
        // =====================================

        const activeArchives =
            archives.filter(
                archive =>
                    archive.status ===
                    SUBSCRIPTION_STATUS.ACTIVE
            );

        if (activeArchives.length) {

            req.flash(
                "error",
                "Active subscriptions cannot be permanently deleted from the archive."
            );

            return res.redirect(
                "/admin/subscriptions/archive"
            );

        }

        // =====================================
        // Delete Eligible Archives
        // =====================================

        const result =
            await SubscriptionArchive.deleteMany({
                _id: {
                    $in: archives.map(
                        archive => archive._id
                    )
                }
            });

        // =====================================
        // Activity Log
        // =====================================

        await logActivity({

            action:
                "Bulk Archive Deleted",

            description:
                `${result.deletedCount} archived subscription(s) permanently removed.`,

            icon:
                "bi-trash-fill",

            color:
                "danger",

            createdBy:
                req.session.user._id

        });

        // =====================================
        // Success
        // =====================================

        req.flash(
            "success",
            `${result.deletedCount} archived subscription(s) permanently deleted.`
        );

        return res.redirect(
            "/admin/subscriptions/archive"
        );

    } catch (error) {

        console.error(
            "Bulk Archive Delete Error:",
            error
        );

        req.flash(
            "error",
            error.message
        );

        return res.redirect(
            "/admin/subscriptions/archive"
        );

    }

};


// =========================================
// Bulk Restore Archived Subscriptions
// =========================================

exports.bulkRestoreArchives = async (req, res) => {

    try {

        let { archiveIds } = req.body;

        // =====================================
        // Normalize archiveIds
        // =====================================

        if (!archiveIds) {

            req.flash(
                "error",
                "No archived subscriptions were selected."
            );

            return res.redirect(
                "/admin/subscriptions/archive"
            );

        }

        if (!Array.isArray(archiveIds)) {

            archiveIds = [archiveIds];

        }

        // =====================================
        // Validate IDs
        // =====================================

        archiveIds = archiveIds.filter(
            id => mongoose.Types.ObjectId.isValid(id)
        );

        if (!archiveIds.length) {

            req.flash(
                "error",
                "No valid archived subscriptions were selected."
            );

            return res.redirect(
                "/admin/subscriptions/archive"
            );

        }

        // =====================================
        // Counters
        // =====================================

        let restored = 0;

        let failed = 0;

        // =====================================
        // Restore Each Archive
        // =====================================

        for (const archiveId of archiveIds) {

            try {

                await subscriptionService.restoreSubscription(

                    archiveId,

                    req.session.user._id

                );

                restored++;

            } catch (error) {

                console.error(

                    `Bulk restore failed for archive ${archiveId}:`,

                    error

                );

                failed++;

            }

        }

        // =====================================
        // Activity Log
        // =====================================

        if (restored > 0) {

            await logActivity({

                action:
                    "Archives Bulk Restored",

                description:
                    `${restored} archived subscription(s) were restored.`,

                icon:
                    "bi-arrow-clockwise",

                color:
                    "success",

                createdBy:
                    req.session.user._id

            });

        }

        // =====================================
        // Flash Result
        // =====================================

        if (restored > 0 && failed === 0) {

            req.flash(

                "success",

                `${restored} subscription(s) restored successfully.`

            );

        } else if (restored > 0 && failed > 0) {

            req.flash(

                "warning",

                `${restored} subscription(s) restored successfully. ${failed} failed.`

            );

        } else {

            req.flash(

                "error",

                "No subscriptions could be restored."

            );

        }

        return res.redirect(

            "/admin/subscriptions/archive"

        );

    } catch (err) {

        console.error(

            "Bulk Archive Restore Error:",

            err

        );

        req.flash(

            "error",

            err.message

        );

        return res.redirect(

            "/admin/subscriptions/archive"

        );

    }

};

// =========================================
// Restore Archived Subscription
// =========================================

exports.restoreSubscription = async (req, res, next) => {

    try {

        const restoredSubscription =
            await subscriptionService.restoreSubscription(

                req.params.id,

                req.session.user._id

            );

        const user = await User.findById(

            restoredSubscription.user

        );

        await logActivity({

            action: "Subscription Restored",

            description:

                `${user.username}'s subscription was restored.`,

            icon: "bi-arrow-clockwise",

            color: "success",

            createdBy: req.session.user._id

        });

        req.flash(

            "success",

            "Subscription restored successfully."

        );

        return res.redirect(

            "/admin/subscriptions/archive"

        );

    } catch (err) {

        req.flash(

            "error",

            err.message

        );

        return res.redirect(

            "/admin/subscriptions/archive"

        );

    }

};

// =========================================
// Permanently Delete Archive
// =========================================

exports.permanentlyDeleteArchive = async (req, res, next) => {

    try {

        const archive = await SubscriptionArchive.findById(

            req.params.id

        );

        if (!archive) {

            req.flash(

                "error",

                "Archive not found."

            );

            return res.redirect(

                "/admin/subscriptions/archive"

            );

        }

        await archive.deleteOne();

        await logActivity({

            action:

                "Archive Deleted",

            description:

                "Subscription archive permanently removed.",

            icon:

                "bi-trash-fill",

            color:

                "danger",

            createdBy:

                req.session.user._id

        });

        req.flash(

            "success",

            "Archive deleted permanently."

        );

        return res.redirect(

            "/admin/subscriptions/archive"

        );

    } catch (err) {

        req.flash(

            "error",

            err.message

        );

        return res.redirect(

            "/admin/subscriptions/archive"

        );

    }

};




// =========================================
// Bulk Permanently Delete Archives
// =========================================

exports.bulkDeleteArchives = async (req, res, next) => {

    try {

        let {
            archiveIds
        } = req.body;

        // =====================================
        // Normalize IDs
        // =====================================

        if (!archiveIds) {

            req.flash(
                "warning",
                "Please select at least one archived subscription."
            );

            return res.redirect(
                "/admin/subscriptions/archive"
            );

        }

        if (!Array.isArray(archiveIds)) {
            archiveIds = [archiveIds];
        }

        // =====================================
        // Remove Empty Values
        // =====================================

        archiveIds = archiveIds.filter(
            id => id && id.trim()
        );

        if (!archiveIds.length) {

            req.flash(
                "warning",
                "Please select at least one archived subscription."
            );

            return res.redirect(
                "/admin/subscriptions/archive"
            );

        }

        // =====================================
        // Find Existing Archives
        // =====================================

        const archives =
            await SubscriptionArchive.find({
                _id: {
                    $in: archiveIds
                }
            }).select("_id");

        if (!archives.length) {

            req.flash(
                "warning",
                "No matching archived subscriptions were found."
            );

            return res.redirect(
                "/admin/subscriptions/archive"
            );

        }

        const validIds =
            archives.map(
                archive => archive._id
            );

        // =====================================
        // Permanently Delete
        // =====================================

        const result =
            await SubscriptionArchive.deleteMany({
                _id: {
                    $in: validIds
                }
            });

        const deletedCount =
            result.deletedCount || 0;

        // =====================================
        // Activity Log
        // =====================================

        if (deletedCount > 0) {

            await logActivity({

                action:
                    "Bulk Archive Deletion",

                description:
                    `${deletedCount} archived subscription(s) permanently removed.`,

                icon:
                    "bi-trash-fill",

                color:
                    "danger",

                createdBy:
                    req.session.user._id

            });

        }

        // =====================================
        // Flash Message
        // =====================================

        if (deletedCount === 0) {

            req.flash(
                "warning",
                "No archived subscriptions were deleted."
            );

        } else {

            req.flash(
                "success",
                `${deletedCount} archived subscription(s) permanently deleted.`
            );

        }

        return res.redirect(
            "/admin/subscriptions/archive"
        );

    } catch (err) {

        console.error(
            "Bulk Archive Delete Error:",
            err
        );

        req.flash(
            "error",
            err.message ||
            "Unable to permanently delete archived subscriptions."
        );

        return res.redirect(
            "/admin/subscriptions/archive"
        );

    }

};


// =========================================
// New Subscription Form
// =========================================

exports.newSubscription = async (req, res, next) => {

    try {

        const users = await User.find()

            .sort({

                username: 1

            })

            .lean();

        res.render(

            "subscriptions/subscriptionForm",

            {

                pageTitle: "New Subscription",

                subscription: null,

                users,

                plans: Object.values(
                    SUBSCRIPTION_PLANS
                ),

                statuses: Object.values(
                    SUBSCRIPTION_STATUS
                ),

                redirectTo: "/subscriptions"

            }

        );

    } catch (err) {

        next(err);

    }

};


// =========================================
// Create Subscription
// =========================================

exports.createSubscription = async (req, res, next) => {

    try {

        const {

            user,
            plan,
            source,
            startedAt,
            expiresAt,
            notes = "",
            cardNumber,
            redirectTo

        } = req.body;

        // =====================================
        // Validate User
        // =====================================

        const selectedUser = await User.findById(user);

        if (!selectedUser) {

            req.flash(
                "error",
                "Selected user does not exist."
            );

            return res.redirect("/subscriptions/new");

        }

        // =====================================
        // Validate Plan
        // =====================================

        if (
            !Object.values(SUBSCRIPTION_PLANS).includes(plan)
        ) {

            req.flash(
                "error",
                "Invalid subscription plan."
            );

            return res.redirect("/subscriptions/new");

        }

        // =====================================
        // Validate Source
        // =====================================

        if (
            !Object.values(SUBSCRIPTION_SOURCES).includes(source)
        ) {

            req.flash(
                "error",
                "Invalid subscription source."
            );

            return res.redirect("/subscriptions/new");

        }

        // =====================================
        // Validate Dates
        // =====================================

        if (!startedAt || !expiresAt) {

            req.flash(
                "error",
                "Start date and expiry date are required."
            );

            return res.redirect("/subscriptions/new");

        }

        const start = new Date(startedAt);
        const expiry = new Date(expiresAt);

        if (expiry <= start) {

            req.flash(
                "error",
                "Expiry date must be after the start date."
            );

            return res.redirect("/subscriptions/new");

        }

        // =====================================
        // Calculate Duration
        // =====================================

        const duration = Math.max(

            1,

            Math.ceil(

                (expiry - start) /

                (1000 * 60 * 60 * 24)

            )

        );

        // =====================================
        // Activate Subscription
        // =====================================

        const result =
            await subscriptionService.activateSubscription({

                user,

                plan,

                duration,

                activatedBy: req.session.user._id,

                notes,

                source,

                cardNumber

            });

        // =====================================
        // Activity Log
        // =====================================

        await logActivity({

            action: "Subscription Created",

            description:
                `${selectedUser.username} subscribed to ${plan}.`,

            icon: "bi-award-fill",

            color: "success",

            createdBy: req.session.user._id

        });

        // =====================================
        // Success Message
        // =====================================

        let message = "";

        switch (result.action) {

            case "created":

                message =
                    "Subscription activated successfully.";

                break;

            case "activated":

                message =
                    "Subscription activated successfully.";

                break;

            case "already_active":

                message =
                    "User already has an active subscription.";

                break;

            default:

                message =
                    "Subscription processed successfully.";

        }

        req.flash("success", message);

        return res.redirect(

            redirectTo ||

            "/admin/subscriptions"

        );

    } catch (err) {

        console.error(err);

        req.flash(

            "error",

            err.message ||

            "Unable to create subscription."

        );

        return res.redirect(

            req.body.redirectTo ||

            "/admin/subscriptions"

        );

    }

};

// =========================================
// Renew Subscription
// =========================================

exports.renewSubscription = async (req, res, next) => {

    try {

        // =====================================
        // Get Subscription
        // =====================================

        const subscription =
            await Subscription.findById(
                req.params.id
            );

        if (!subscription) {

            req.flash(
                "error",
                "Subscription not found."
            );

            return res.redirect(
                "/admin/subscriptions"
            );

        }


        // =====================================
        // Determine Renewal Values
        // =====================================

        const plan =
            req.body.plan ||
            subscription.plan;

        const duration =
            Number(req.body.duration) || 30;

        const notes =
            req.body.notes || "";

        const source =
            req.body.source ||
            SUBSCRIPTION_SOURCES.MANUAL;

        const paymentReference =
            req.body.paymentReference ||
            "";


        // =====================================
        // Renew Subscription
        // =====================================

        const result =
            await subscriptionService.renewSubscription({

                user:
                    subscription.user,

                plan,

                duration,

                renewedBy:
                    req.session.user._id,

                notes,

                source,

                paymentReference

            });


        // =====================================
        // Get User
        // =====================================

        const user =
            await User.findById(
                result.subscription.user
            );


        // =====================================
        // Activity Log
        // =====================================

        await logActivity({

            action:
                "Subscription Renewed",

            description:
                `${user?.username || "User"}'s ${result.subscription.plan} subscription was renewed.`,

            icon:
                "bi-arrow-repeat",

            color:
                "primary",

            createdBy:
                req.session.user._id

        });


        // =====================================
        // Success Message
        // =====================================

        req.flash(
            "success",
            "Subscription renewed successfully."
        );


        return res.redirect(
            "/admin/subscriptions"
        );


    } catch (err) {

        console.error(
            "Renew Subscription Error:",
            err
        );


        req.flash(
            "error",
            err.message ||
            "Unable to renew subscription."
        );


        return res.redirect(
            "/admin/subscriptions"
        );

    }

};




exports.editSubscription = async (req, res, next) => {

    try {

        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {

            req.flash(
                "error",
                "Subscription not found."
            );

            return res.redirect("/admin/subscriptions");

        }

        const users = await User.find()
            .sort({ username: 1 });


        res.render("subscriptions/subscriptionForm", {

            pageTitle: "Edit Subscription",

            subscription,

            users,

            plans: Object.values(SUBSCRIPTION_PLANS),

            statuses: Object.values(SUBSCRIPTION_STATUS),

            sources: Object.values(SUBSCRIPTION_SOURCES),

            cards: Object.values(SUBSCRIPTION_CARDS),

            redirectTo: "/admin/subscriptions"

        });

    } catch (err) {

        next(err);

    }

};



// =========================================
// Update Subscription
// =========================================

exports.updateSubscription = async (req, res, next) => {

    const redirectTo =
        req.body?.redirectTo ||
        "/admin/subscriptions";

    try {

        const {
            user,
            plan,
            status,
            source,
            startedAt,
            expiresAt,
            notes = "",
            cardNumber
        } = req.body;

        // =====================================
        // Validate Required Fields
        // =====================================

        if (
            !user ||
            !plan ||
            !status ||
            !source ||
            !startedAt ||
            !expiresAt
        ) {

            req.flash(
                "error",
                "All required subscription fields must be provided."
            );

            return res.redirect(redirectTo);

        }

        // =====================================
        // Validate Dates
        // =====================================

        const startDate = new Date(startedAt);
        const expiryDate = new Date(expiresAt);

        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(expiryDate.getTime())
        ) {

            req.flash(
                "error",
                "Invalid subscription dates."
            );

            return res.redirect(redirectTo);

        }

        if (expiryDate <= startDate) {

            req.flash(
                "error",
                "Expiry date must be after the start date."
            );

            return res.redirect(redirectTo);

        }

        // =====================================
        // Validate User
        // =====================================

        const selectedUser =
            await User.findById(user);

        if (!selectedUser) {

            req.flash(
                "error",
                "Selected user does not exist."
            );

            return res.redirect(redirectTo);

        }

        // =====================================
        // Validate Plan
        // =====================================

        if (
            !Object.values(SUBSCRIPTION_PLANS)
                .includes(plan)
        ) {

            req.flash(
                "error",
                "Invalid subscription plan."
            );

            return res.redirect(redirectTo);

        }

        // =====================================
        // Validate Status
        // =====================================

        if (
            !Object.values(SUBSCRIPTION_STATUS)
                .includes(status)
        ) {

            req.flash(
                "error",
                "Invalid subscription status."
            );

            return res.redirect(redirectTo);

        }

        // =====================================
        // Validate Source
        // =====================================

        if (
            !Object.values(SUBSCRIPTION_SOURCES)
                .includes(source)
        ) {

            req.flash(
                "error",
                "Invalid subscription source."
            );

            return res.redirect(redirectTo);

        }

        // =====================================
        // Find Subscription
        // =====================================

        const subscription =
            await Subscription.findById(
                req.params.id
            );

        if (!subscription) {

            req.flash(
                "error",
                "Subscription not found."
            );

            return res.redirect(
                "/admin/subscriptions"
            );

        }

        // =====================================
        // Preserve Original User
        // =====================================

        const originalUser =
            subscription.user?.toString();

        // =====================================
        // Update Subscription
        // =====================================

        subscription.user = user;
        subscription.plan = plan;
        subscription.status = status;
        subscription.source = source;
        subscription.startedAt = startDate;
        subscription.expiresAt = expiryDate;
        subscription.notes = notes;
        subscription.cardNumber = cardNumber || null;

        await subscription.save();

        // =====================================
        // Synchronize Selected User
        // =====================================

        await subscriptionService
            .syncUserSubscription(subscription);

        // =====================================
        // If User Was Changed
        // Clear Previous User Snapshot
        // =====================================

        if (
            originalUser &&
            originalUser !== user.toString()
        ) {

            await User.findByIdAndUpdate(
                originalUser,
                {
                    subscriptionPlan:
                        SUBSCRIPTION_PLANS.FREE,

                    subscriptionStatus:
                        SUBSCRIPTION_STATUS.INACTIVE,

                    subscriptionStartedAt: null,

                    subscriptionExpiresAt: null
                },
                {
                    runValidators: true
                }
            );

        }

        // =====================================
        // Activity Log
        // =====================================

        await logActivity({

            action: "Subscription Updated",

            description:
                `${selectedUser.username}'s subscription was updated.`,

            icon: "bi-pencil-square",

            color: "warning",

            createdBy:
                req.session.user._id

        });

        // =====================================
        // Success
        // =====================================

        req.flash(
            "success",
            "Subscription updated successfully."
        );

        return res.redirect(
            redirectTo
        );

    } catch (error) {

        console.error(
            "Update Subscription Error:",
            error
        );

        req.flash(
            "error",
            error.message ||
            "Unable to update subscription."
        );

        return res.redirect(
            redirectTo
        );

    }

};





exports.bulkAction = async (req, res, next) => {

    console.log("🔥Bulk Action HIT!!!", req.method, req.originalUrl, req.body);

    try {

        let { subscriptionIds, action } = req.body;

        // ==========================
        // Validation
        // ==========================

        if (!subscriptionIds) {

            req.flash(
                "warning",
                "Please select at least one subscription."
            );

            return res.redirect("/admin/subscriptions");

        }

        if (!action) {

            req.flash(
                "warning",
                "Please select a bulk action."
            );

            return res.redirect("/admin/subscriptions");

        }

        if (!Array.isArray(subscriptionIds)) {

            subscriptionIds = [subscriptionIds];

        }

        const subscriptions = await Subscription.find({

            _id: {
                $in: subscriptionIds
            }

        });

        if (!subscriptions.length) {

            req.flash(
                "warning",
                "No subscriptions found."
            );

            return res.redirect("/admin/subscriptions");

        }

        let message = "";

        switch (action) {

            // =====================================
            // Activate
            // =====================================

            case "activate": {

                let created = 0;

                let activated = 0;

                let alreadyActive = 0;

                let failed = 0;

                for (const subscription of subscriptions) {

                    try {

                        const result =
                            await subscriptionService.activateSubscription({

                                user: subscription.user,

                                plan: subscription.plan,

                                duration: Math.max(
                                    1,
                                    Math.ceil(
                                        (
                                            new Date(subscription.expiresAt) -
                                            new Date(subscription.startedAt)
                                        ) /
                                        (1000 * 60 * 60 * 24)
                                    )
                                ),

                                activatedBy: req.session.user._id,

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

                    }

                    catch (error) {

                        console.error(error);

                        failed++;

                    }

                }

                await logActivity({

                    action: "Bulk Subscription Activation",

                    description:
                        `${created} created, ${activated} activated, ${alreadyActive} already active, ${failed} failed.`,

                    icon: "bi-award-fill",

                    color: "success",

                    createdBy: req.session.user._id

                });

                message =
                    `Bulk activation completed. ${created} created, ${activated} activated, ${alreadyActive} already active, ${failed} failed.`;

                break;

            }

            // =====================================
            // Suspend
            // =====================================

            case "suspend":

                for (const subscription of subscriptions) {

                    await subscriptionService.suspendSubscription({

                        user: subscription.user
                    });

                }

                await logActivity({

                    action: "Bulk Subscription Suspension",

                    description:
                        `${subscriptions.length} subscription(s) suspended.`,

                    icon: "bi-pause-circle-fill",

                    color: "warning",

                    createdBy: req.session.user._id

                });

                message =
                    `${subscriptions.length} subscription(s) suspended successfully.`;

                break;

            // =====================================
            // Delete
            // =====================================

            case "delete":

                if (!subscriptionIds.length) {

                     req.flash(
                        "error", 
                        "No subscription selected."
                    ); 
                    
                    return res.redirect("/admin/subscriptions"); }

                for (const id of subscriptionIds) {

                    await subscriptionService.deleteSubscription(

                        id,

                        req.session.user._id,

                        ARCHIVE_REASONS.BULK_DELETED

                    );

                }

                await logActivity({

                    action: "Bulk Archive Subscription",

                    description: `${subscriptionIds.length} subscription(s) archived.`,

                    icon: "bi-archive-fill",

                    color: "warning",

                    createdBy: req.session.user._id

                });

                message =
                    `${subscriptionIds.length} subscription(s) moved to archive successfully.`;

                break;

            default:

                req.flash(
                    "error",
                    "Invalid bulk action."
                );

                return res.redirect("/admin/subscriptions");

        }

        if(message) {
            req.flash("success", message);
        }

        return res.redirect("/admin/subscriptions");

    } catch (err) {

        console.error("Bulk Action Error: ");
        console.error(err);
        console.error(err.stack);

        req.flash("error", "Something went wrong during bulk action.");

        return res.redirect("/admin/subscriptions");

        next(err);

    }

};


// =========================================
// Delete Subscription
// =========================================

exports.deleteSubscription = async (req, res, next) => {

    try {

        const { id } = req.params;

        const subscription = await Subscription.findById(id)
            .populate("user", "username");

        if (!subscription) {

            req.flash(
                "error",
                "Subscription not found."
            );

            return res.redirect("/admin/subscriptions");

        }

        await subscriptionService.deleteSubscription(

            id,

            req.session.user._id,

            "Deleted"

        );

        await logActivity({

            action: "Subscription Deleted",

            description:
                `${subscription.user.username}'s subscription was deleted.`,

            icon: "bi-trash-fill",

            color: "danger",

            createdBy: req.session.user._id

        });

        req.flash(

            "success",

            "Subscription archived successfully."

        );

        return res.redirect("/admin/subscriptions");

    } catch (err) {

        console.error(err);

        req.flash(

            "error",

            err.message ||

            "Unable to archive subscription."

        );

        return res.redirect("/admin/subscriptions");

    }

};




exports.deleteSubscriptionByUser = async (req, res) => {

    try {

        const { userId } = req.params;
        const adminId = req.session.user._id;

        const subscription = await Subscription.findOne({
            user: userId
        });

        if (!subscription) {

            req.flash(
                "error",
                "No subscription found for this user."
            );

            return res.redirect("/admin/subscriptions");

        }

        await subscriptionService.deleteSubscription(

            subscription._id,

            adminId,

            ARCHIVE_REASONS.DELETED

        );

        req.flash(

            "success",

            "Subscription archived successfully."

        );

        return res.redirect("/admin/subscriptions");

    } catch (error) {

        console.error(error);

        req.flash("error", error.message);

        return res.redirect("/admin/subscriptions");

    }

};