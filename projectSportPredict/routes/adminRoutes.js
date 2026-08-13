const express = require("express");

const router = express.Router();


const dashboardController = require("../controllers/admin/dashboardController");
const userController = require("../controllers/admin/userController");
const predictionController = require("../controllers/admin/predictionController");
const activitiesController = require("../controllers/admin/activitiesController");


const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

// const ROLES = require("../config/roles");

const { ROLES } = require("../config/constants");


const subscriptionController = require("../controllers/admin/subscriptionController");

const paymentController =
    require("../controllers/admin/paymentController");


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


router.post(
    "/users/:id/activate-subscription",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    subscriptionController.activateSubscription
);

router.get(
    "/subscriptions",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN, 
        ROLES.SUPERUSER
    ), 
    subscriptionController.subscriptions
);


// =========================================
// Subscription Archive
// =========================================

router.get(
    "/subscriptions/archive",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    subscriptionController.archivedSubscriptions
);

// =========================================
// Subscription Details
// =========================================

router.get(
    "/subscriptions/:id",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    subscriptionController.subscriptionDetails
);

router.post(
    "/subscriptions/bulk",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    subscriptionController.bulkAction
);


router.post(
    "/subscriptions/:id/delete",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    subscriptionController.deleteSubscription
);





// =========================================
// Bulk Archive Actions
// =========================================

router.post(
    "/subscriptions/archive/bulk-delete",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    subscriptionController.bulkDeleteArchives
);


router.post(
    "/subscriptions/archive/bulk-restore",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    subscriptionController.bulkRestoreArchives
);


router.post(
    "/subscriptions/archive/:id/restore",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    subscriptionController.restoreSubscription
);

router.post(
    "/subscriptions/archive/:id/delete",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    subscriptionController.permanentlyDeleteArchive
);



//Archive all subscriptions for a specific user

router.post(
    "/subscriptions/delete/user/:userId",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.SUPERUSER,
        ROLES.ADMIN
    ),
    subscriptionController.deleteSubscriptionByUser
);


    // =========================================
// Payment Management
// =========================================


// =========================================
// Payment List
// =========================================

router.get(
    "/payments",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    paymentController.payments
);



router.get(
    "/payments/create",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    paymentController.createPaymentForm
);


// =========================================
// Create Manual Payment
// =========================================

router.post(
    "/payments",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    paymentController.createPayment
);

// =========================================
// Process Successful Payment
// =========================================

router.post(
    "/payments/:id/process",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    paymentController.processSuccessfulPayment
);

// =========================================
// Payment Details
// =========================================

router.get(
    "/payments/:id",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    paymentController.paymentDetails
);


router.post(
    "/payments/:id/paystack/initialize",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    paymentController.initializePaystackPayment
);


// =========================================
// Complete / Process Payment
// =========================================

router.post(
    "/payments/:id/complete",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    paymentController.completePayment
);


// =========================================
// Fail Payment
// =========================================

router.post(
    "/payments/:id/fail",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    paymentController.failPayment
);


// =========================================
// Abandon Payment
// =========================================

router.post(
    "/payments/:id/abandon",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    paymentController.abandonPayment
);


// =========================================
// Refund Payment
// =========================================

router.post(
    "/payments/:id/refund",
    authMiddleware.isLoggedIn,
    roleMiddleware.allowRoles(
        ROLES.ADMIN,
        ROLES.SUPERUSER
    ),
    paymentController.refundPayment
);



module.exports = router;

