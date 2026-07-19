const express = require("express");

const router = express.Router();

const adminController = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

const ROLES = require("../config/roles");

router.get(
    "/",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    adminController.dashboard
);

router.get(
    "/dashboard",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    adminController.dashboard
);

module.exports = router;