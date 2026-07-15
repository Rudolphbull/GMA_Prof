
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



router.get(
    "/:id/edit",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(ROLES.SUPERUSER, ROLES.ADMIN),
    predictionController.editPrediction
);

router.post(
    "/:id",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(ROLES.SUPERUSER, ROLES.ADMIN),
    predictionController.updatePrediction
);


router.post(
    "/:id/delete",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    predictionController.deletePrediction
);


module.exports = router;

