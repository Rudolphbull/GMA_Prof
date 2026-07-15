const express = require("express");
const router = express.Router();

const premiumController = require("../controllers/premiumController");
const predictionController = require("../controllers/predictionController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ROLES = require("../config/roles");

router.get("/premium", premiumController.premium);

router.post(
    "/premium",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    predictionController.createPrediction
);

module.exports = router;