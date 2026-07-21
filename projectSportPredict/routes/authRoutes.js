const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ROLES = require("../config/roles");


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



router.get("/logout", authController.logout);


module.exports = router;