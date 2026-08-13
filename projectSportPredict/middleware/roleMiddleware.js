const { ROLES } = require("../config/constants");

exports.allowRoles = (...roles) => {

    return (req, res, next) => {

        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (!roles.includes(req.session.user.role)) {
            return res.status(403).render("403", {
                pageTitle: "Access Denied",
                message: ""
            });
        }

        next();

    };

};

