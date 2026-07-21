
const User = require("../../models/userModel");


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

        req.flash(
            "success", 
            "User deleted successfully."
        );

        res.redirect("/admin/users");

    } catch (err) {

        next(err);

    }

};