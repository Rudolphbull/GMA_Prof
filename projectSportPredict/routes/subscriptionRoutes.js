const express = require("express");

const router = express.Router();

const subscriptionController = require("../controllers/admin/subscriptionController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const { ROLES } = require("../config/constants");



router.use(

    authMiddleware.isLoggedIn,

    roleMiddleware.allowRoles(

        ROLES.SUPERUSER,

        ROLES.ADMIN

    )

);



router.get(

    "/",

    subscriptionController.subscriptions

);



router.get(

    "/new",

    subscriptionController.newSubscription

);



router.post(

    "/",

    subscriptionController.createSubscription

);


router.post(
    "/:id/renew",

    subscriptionController.renewSubscription
);


// router.get(

//     "/:id",

//     subscriptionController.subscriptionDetails

// );



router.get(

    "/:id/edit",

    subscriptionController.editSubscription

);



router.post(

    "/:id",

    subscriptionController.updateSubscription

);






module.exports = router;