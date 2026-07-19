const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ROLES = require("../config/roles");

// const adminController = require("../controllers/adminController");

// Public
router.get("/login", authController.newLogin);
router.post("/login", authController.login);

router.get("/signup", authController.newSignup);
router.post("/signup", authController.signup);

router.get("/about", authController.about);

router.get("/contact", authController.contact);
router.post("/send", authController.send);
router.get("/booking", authController.booking);

router.get("/career", authController.career);

router.get("/success", authController.success);

router.get("/logout", authController.logout);

// Admin
// router.get(
//     "/admin",
//     authMiddleware,
//     roleMiddleware(ROLES.ADMIN),
//     adminController.dashboard
// );

module.exports = router;