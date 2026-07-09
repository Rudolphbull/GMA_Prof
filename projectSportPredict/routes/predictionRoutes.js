
const express = require("express");
const router = express.Router();

const predictionController = require("../controllers/predictionController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ROLES = require("../config/roles");

router.get(
    "/new",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    predictionController.newPrediction
);

router.post(
    "/",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    predictionController.createPrediction
);

module.exports = router;

