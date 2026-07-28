
const User = require("../../models/userModel");
const logActivity = require("../../utils/activityLogger");


exports.users = async (req, res, next) => {

    try {

        const search = req.query.search || "";

        const role = req.query.role || "";

        const subscription = req.query.subscription || "";

        const page = parseInt(req.query.page) || 1;

        const limit = 10;

        const skip = (page - 1) * limit;

        const query = {};

        if (search) {

            query.$or = [

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

            ];

        }

        if (role) {
            query.role = role;
        }

        if (subscription) {
            query.subscriptionStatus = subscription;
        }

        const [users, totalUsers] = await Promise.all([

            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            User.countDocuments(query)

        ]);

        const totalPages = Math.ceil(totalUsers / limit);

        res.render("admin/users", {

            pageTitle: "Manage Users",

            users,

            search,

            role,

            subscription,

            currentPage: page,

            totalPages,

            totalUsers,

            limit

        });

    } catch (err) {

        next(err);

    }

};


exports.editUser = async (req, res, next) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user) {

            return res.status(404).render("404", {

                pageTitle: "User Not Found",

                message: "The requested user could not be found.",

                details: "The account may have already been removed."

            });

        }

        res.render("admin/editUser", {

            pageTitle: "Edit User",

            user

        });

    } catch (err) {

        next(err);

    }

};



exports.bulkAction = async (req, res, next) => {
    try {
        let { userIds, action } = req.body;

        // Nothing selected
        if (!userIds) {
            req.flash("warning", "Please select at least one user.");
            return res.redirect("/admin/users");
        }

        // No action selected
        if (!action) {
            req.flash("error", "Please select a bulk action.");
            return res.redirect("/admin/users");
        }

        // Convert single checkbox to array
        if (!Array.isArray(userIds)) {
            userIds = [userIds];
        }

        // Fetch selected users once
        const selectedUsers = await User.find({
            _id: { $in: userIds }
        });

        let message = "";

        switch (action) {

            case "user": {

                const selectedAdminCount = selectedUsers.filter(
                    u => u.role === "admin"
                ).length;

                const totalAdminCount = await User.countDocuments({
                    role: "admin"
                });

                if (selectedAdminCount > 0 &&
                    selectedAdminCount === totalAdminCount) {

                    const err = new Error(
                        "The last Admin cannot be demoted."
                    );

                    err.status = 403;
                    err.details =
                        "At least one Admin account must remain in the system.";

                    return next(err);
                }

                const selectedSuperuserCount = selectedUsers.filter(
                    u => u.role === "superuser"
                ).length;

                const totalSuperuserCount = await User.countDocuments({
                    role: "superuser"
                });

                if (
                    selectedSuperuserCount > 0 &&
                    selectedSuperuserCount === totalSuperuserCount
                ) {

                    const err = new Error(
                        "The last Superuser cannot be demoted."
                    );

                    err.status = 403;
                    err.details =
                        "At least one Superuser account must remain in the system.";

                    return next(err);
                }

                await User.updateMany(
                    { _id: { $in: userIds } },
                    { role: "user" }
                );

                await logActivity({
                    action: "Bulk Role Update",
                    description: `${userIds.length} users changed to User(s).`,
                    icon: "bi-check-circle-fill",
                    color: "success",
                    createdBy: req.session.user._id
                });

                message = `${userIds.length} user(s) updated successfully.`;

                break;
            }

            case "superuser": {

                await User.updateMany(
                    { _id: { $in: userIds } },
                    { role: "superuser" }
                );

                await logActivity({
                    action: "Bulk Role Update",
                    description: `${userIds.length} users changed to Superuser(s).`,
                    icon: "bi-check-circle-fill",
                    color: "success",
                    createdBy: req.session.user._id
                });

                message = `${userIds.length} user(s) updated successfully.`;

                break;
            }

            case "admin": {

                const selectedSuperuserCount = selectedUsers.filter(
                    u => u.role === "superuser"
                ).length;

                const totalSuperuserCount = await User.countDocuments({
                    role: "superuser"
                });

                if (
                    selectedSuperuserCount > 0 &&
                    selectedSuperuserCount === totalSuperuserCount
                ) {

                    const err = new Error(
                        "The last Superuser cannot be demoted."
                    );

                    err.status = 403;
                    err.details =
                        "At least one Superuser account must remain in the system.";

                    return next(err);
                }

                await User.updateMany(
                    { _id: { $in: userIds } },
                    { role: "admin" }
                );

                await logActivity({
                    action: "Bulk Role Update",
                    description: `${userIds.length} users changed to Admin(s).`,
                    icon: "bi-check-circle-fill",
                    color: "success",
                    createdBy: req.session.user._id
                });

                message = `${userIds.length} user(s) updated successfully.`;

                break;
            }

            case "inactive": {

                await User.updateMany(
                    { _id: { $in: userIds } },
                    { subscriptionStatus: "inactive" }
                );

                await logActivity({
                    action: "Bulk subscriptionStatus Update",
                    description: `${userIds.length} users changed to Inactive`,
                    icon: "bi-gem",
                    color: "warning",
                    createdBy: req.session.user._id
                });

                message = `${userIds.length} user(s) updated successfully.`;

                break;
            }

            case "active": {

                await User.updateMany(
                    { _id: { $in: userIds } },
                    { subscriptionStatus: "active" }
                );

                await logActivity({
                    action: "Bulk subscriptionStatus Update",
                    description: `${userIds.length} users changed to Active`,
                    icon: "bi-unlock-fill",
                    color: "warning",
                    createdBy: req.session.user._id
                });

                message = `${userIds.length} user(s) updated successfully.`;

                break;
            }

            case "expired": {

                await User.updateMany(
                    { _id: { $in: userIds } },
                    { subscriptionStatus: "expired" }
                );

                await logActivity({
                    action: "Bulk subscriptionStatus Update",
                    description: `${userIds.length} users changed to Expired`,
                    icon: "bi-unlock-fill",
                    color: "warning",
                    createdBy: req.session.user._id
                });

                message = `${userIds.length} user(s) updated successfully.`;

                break;
            }

            case "delete": {

                const selectedAdminCount = selectedUsers.filter(
                    u => u.role === "admin"
                ).length;

                const totalAdminCount = await User.countDocuments({
                    role: "admin"
                });

                if (
                    selectedAdminCount > 0 &&
                    selectedAdminCount === totalAdminCount
                ) {

                    const err = new Error(
                        "The last Admin cannot be deleted."
                    );

                    err.status = 403;
                    err.details =
                        "At least one Admin account must remain in the system.";

                    return next(err);
                }

                const selectedSuperuserCount = selectedUsers.filter(
                    u => u.role === "superuser"
                ).length;

                const totalSuperuserCount = await User.countDocuments({
                    role: "superuser"
                });

                if (
                    selectedSuperuserCount > 0 &&
                    selectedSuperuserCount === totalSuperuserCount
                ) {

                    const err = new Error(
                        "The last Superuser cannot be deleted."
                    );

                    err.status = 403;
                    err.details =
                        "At least one Superuser account must remain in the system.";

                    return next(err);
                }

                await User.deleteMany({
                    _id: { $in: userIds }
                });

                await logActivity({
                    action: "Bulk Delete Update",
                    description: `${userIds.length} users deleted`,
                    icon: "bi-trash-fill",
                    color: "danger",
                    createdBy: req.session.user._id
                });

                message = `${userIds.length} user(s) deleted successfully.`;

                break;
            }

            default:
                req.flash("error", "Invalid bulk action.");
                return res.redirect("/admin/users");
        }

        req.flash("success", message);
        return res.redirect("/admin/users");

    } catch (err) {
        next(err);
    }
};




exports.updateUser = async (req, res, next) => {

    try {

        const {

            role,

            subscriptionStatus

        } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {

            return res.status(404).render("404", {

                pageTitle: "User Not Found"

            });

        }

        user.role = role;

        user.subscriptionStatus = subscriptionStatus;

        await user.save();

        await logActivity({

            action: "User Updated",

            description: `${user.username} → Role: ${role}, Subscription: ${subscriptionStatus}`,

            icon: "bi-person-fill-gear",

            color: "info",

            createdBy: req.session.user._id

        });

        req.flash("success", "User updated successfully.");

        res.redirect("/admin/users");

    } catch (err) {

        next(err);

    }

};

exports.deleteUser = async (req, res, next) => {

    try {

        // Prevent deleting yourself

        if (req.session.user._id.toString() === req.params.id) {

            const err = new Error("You cannot delete your own account.");

            err.status = 403;

            err.details =
                "For security reasons, administrators cannot delete the account they are currently signed in with.";

            return next(err);

        }

        const user = await User.findById(req.params.id);

        if (!user) {

            const err = new Error("User not found.");

            err.status = 404;

            err.details =
                "The requested account may have already been removed.";

            return next(err);

        }


        if (user.role === "superuser") {

            const superUserCount = await User.countDocuments({

                role: "superuser"

            });

            if (superUserCount === 1) {

                const err = new Error(
                    "The last Superuser cannot be deleted."
                );

                err.status = 403;

                err.details =
                    "At least one Superuser account must remain in the system.";

                return next(err);

            }

        }

        await User.findByIdAndDelete(req.params.id);

        await logActivity({

            action: "User Deleted",

            description: `${user.username} → Role: ${user.role}, Subscription: ${user.subscriptionStatus}`,

            icon: "bi-person-x-fill",

            color: "danger",

            createdBy: req.session.user._id

        });

        req.flash(
            "success", 
            "User deleted successfully."
        );

        res.redirect("/admin/users");

    } catch (err) {

        next(err);

    }

};