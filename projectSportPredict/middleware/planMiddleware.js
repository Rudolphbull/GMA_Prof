const User = require("../models/userModel");
const {
    SUBSCRIPTION_STATUS,
} = require("../config/constants");

exports.allowPlans = (...plans) => {

    return async (req, res, next) => {

        try {

            // User not logged in
            if (!req.session.user) {
                return res.redirect("/auth/login");
            }

            // Get latest user from database
            const user = await User.findById(req.session.user._id);

            if (!user) {
                req.session.destroy();
                return res.redirect("/auth/login");
            }

            // Subscription must be active
            if (user.subscriptionStatus !== SUBSCRIPTION_STATUS.ACTIVE) {
                return res.status(403).render("403", {
                    pageTitle: "Subscription Required",
                    message: "Your subscription is inactive."
                });
            }

            // Subscription must not have expired
            if (
                user.subscriptionExpiresAt &&
                user.subscriptionExpiresAt < new Date()
            ) {
                return res.status(403).render("403", {
                    pageTitle: "Subscription Expired",
                    message:
                        "Your subscription has expired. Please renew to continue."
                });
            }

            // Plan must be allowed
            if (!plans.includes(user.subscriptionPlan)) {
                return res.status(403).render("403", {
                    pageTitle: "Upgrade Required",
                    message:
                        "This page is available only to Premium and VIP members."
                });
            }

            // Make fresh user available downstream
            req.user = user;

            next();

        } catch (err) {

            console.error(err);

            return res.status(500).render("500", {
                pageTitle: "Server Error"
            });

        }

    };

};