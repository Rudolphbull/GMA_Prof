const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/admin/dashboardController");
const userController = require("../controllers/admin/userController");
const predictionController = require("../controllers/admin/predictionController");
const activitiesController = require("../controllers/admin/activitiesController");


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
    dashboardController.dashboard
);

router.get(
    "/dashboard",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    dashboardController.dashboard
);


router.get(
    "/users",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    userController.users
);


router.post(
    "/predictions/bulk",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    predictionController.bulkAction
);


router.post(
    "/users/bulk",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    userController.bulkAction
);

router.get(
    "/users/:id/edit",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    userController.editUser
);


router.post(
    "/users/:id",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    userController.updateUser
);


router.post(
    "/users/:id/delete",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER, 
        ROLES.ADMIN
    ),
    userController.deleteUser
);


router.get(
    "/predictions",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER, 
        ROLES.ADMIN
    ),
    predictionController.predictions
);


router.post(
    "/predictions/:id/delete",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    predictionController.deletePrediction
);

router.get("/activities", 
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    activitiesController.activities
);

module.exports = router;