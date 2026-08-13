
const express = require("express");
const router = express.Router();


const predictionController = require("../controllers/predictionController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const planMiddleware = require("../middleware/planMiddleware");
const { ROLES } = require("../config/constants");
const {SUBSCRIPTION_PLANS} = require("../config/constants");
// const ROLES = require("../config/roles");


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



router.get(
    "/yesterdaysresults",
    authMiddleware.isLoggedIn,
    predictionController.yesterdaysresults
);


router.get(
    "/premium", 
    authMiddleware.isLoggedIn,
    planMiddleware.allowPlans(
        SUBSCRIPTION_PLANS.PREMIUM,
        SUBSCRIPTION_PLANS.VIP
    ),
     
    predictionController.premium
);

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

