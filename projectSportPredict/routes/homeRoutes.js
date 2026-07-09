const express = require("express");
const router = express.Router();

const homeController = require("../controllers/homeController");
const predictionController = require("../controllers/predictionController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ROLES = require("../config/roles");

router.get("/", homeController.index);

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