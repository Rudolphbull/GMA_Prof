const bcrypt = require("bcrypt");

const Prediction = require("../models/predictionModel");

const User = require("../models/userModel");

const logActivity = require("../utils/activityLogger");

const {
    ROLES
} = require("../config/constants");

exports.newLogin = (req, res) => {
    res.render("login", {pageTitle: "Login"});
};

exports.newSignup = (req, res) => {
    res.render("signup", {pageTitle: "Signup"});
};

exports.login = async (req, res) => {

    try {
        
        // Validate input first
        if (!req.body.login || !req.body.password) {

            req.flash(
                "error",
                "Invalid Login Credentials."
            );

            return res.redirect("/auth/login");

        }

        // Search for the user
        const user = await User.findOne({
            $or: [
                { username: req.body.login },
                { email: req.body.login }
            ]
        });

        // Check if user exists
        if (!user) {

            req.flash(
                "error",
                "Invalid Login Credentials."
            );

            return res.redirect("/auth/login");

        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!passwordMatch) {

            req.flash(
                "error",
                "Invalid Login Credentials."
            );

            return res.redirect("/auth/login");

        }

        // Create a session
        req.session.user = {
            _id: user._id,
            username: user.username.toLowerCase().trim(),
            email: user.email.toLowerCase().trim(),
            role: user.role || ROLES.USER
        };

        await logActivity({
            action: "User Login",
            description: user.username,
            icon: "bi-box-arrow-in-right",
            color: "success",
            createdBy: user._id
        });

        req.flash(
            "success", 
            "Login Successful."
        );

        if (user.subscriptionPlan === "Premium" || user.subscriptionPlan === "Vip") {

            // Redirect to the dashboard
            res.redirect("/predictions/premium");

        } else {
            res.redirect("/");
        }


    } catch (err) {

        console.error(err);

        req.flash(
            "error",
            "Invalid Login Credentials."
        );

        return res.redirect("/auth/login");

    }

};



exports.signup = async (req, res) => {

    try {

        // ==========================
        // Normalize Input
        // ==========================
        const username = req.body.username?.toLowerCase().trim();
        const email = req.body.email?.toLowerCase().trim();
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;

        // ==========================
        // Required Fields Validation
        // ==========================
        if (
            !username ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            req.flash(
                "error",
                "Please complete all required fields."
            );

            return res.redirect("/auth/signup");
        }

        // ==========================
        // Password Confirmation
        // ==========================
        if (password !== confirmPassword) {

            req.flash(
                "error",
                "Passwords do not match."
            );

            return res.redirect("/auth/signup");
        }

        // ==========================
        // Check Existing User
        // ==========================
        const existingUser = await User.findOne({

            $or: [
                { username },
                { email }
            ]

        });

        if (existingUser) {

            req.flash(
                "error",
                "Username or Email already exists."
            );

            return res.redirect("/auth/signup");
        }

        // ==========================
        // Hash Password
        // ==========================
        const hashedPassword = await bcrypt.hash(password, 10);

        // ==========================
        // Create User
        // ==========================
        const user = new User({

            username,
            email,
            password: hashedPassword,
            role: ROLES.USER

        });

        await user.save();

        // ==========================
        // Log Activity
        // ==========================
        await logActivity({

            action: "User Registered",
            description: user.username,
            icon: "bi-person-plus-fill",
            color: "primary",
            createdBy: user._id

        });

        // ==========================
        // Success
        // ==========================
        req.flash(
            "success",
            "Account created successfully. Please login."
        );

        return res.redirect("/auth/login");

    } catch (err) {

        console.error(err);

        // ==========================
        // Mongo Duplicate Key Error
        // ==========================
        if (err.code === 11000) {

            req.flash(
                "error",
                "Username or Email already exists."
            );

            return res.redirect("/auth/signup");
        }

        // ==========================
        // Unexpected Errors
        // ==========================
        req.flash(
            "error",
            "Failed to create user account. Please try again."
        );

        return res.redirect("/auth/signup");
    }

};


exports.logout = (req, res) => {

    req.session.user = null;

    req.flash(
        "success",
        "Logout successful."
    );

    req.session.save((err) => {

        if (err) {
            console.error(err);
            return res.redirect("/");
        }

        res.clearCookie("connect.sid");

        res.redirect("/");

    });

};


exports.contact = (req, res) => {
    res.render("contact", {pageTitle: "Contact"});
};

exports.about = (req, res) => {
    res.render("about", {pageTitle: "About"});
};

exports.career = (req, res) => {
    res.render("career", {pageTitle: "Career"});
};



exports.send = async function(req, res) {

    const { name, email, message } = req.body;

    if (!name || !email || !message) {

        req.flash(
            "error", 
            "Please complete all required fields."
        );
    }

    try {

        await sendTheEmail({
            name,
            email,
            subject: `New message from ${name} via profPredict`,
            html: `
                <h2>New Contact Message(Prof Predict)</h2>

                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>

                <h3>Message</h3>
                <p>${message}</p>
            `
        });

        req.flash(
            "success", 
            "Message sent successfully."
        );

        return res.redirect("/auth/contact");

    } catch(error) {

        console.log(error);

        req.flash("error", "Message sending failed.");

        return res.redirect("/auth/contact");
    }
};



exports.booking = async function(req, res) {

    const { companyName, email, phone, enquiry, details } = req.body;

    if (!companyName || !email || !phone || !enquiry || !details) {

        req.flash(
            "error", 
            "Please complete all required fields."
        );
        return res.redirect("/auth/contact");
    }

    try {

        await sendTheEmail({
            name: companyName,
            email,
            subject: `New consultation request from ${companyName}`,
            html: `
                <h2>New Consultation Request(Prof Predict)</h2>

                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Enquiry:</strong> ${enquiry}</p>

                <h3>Details</h3>
                <p>${details}</p>
            `
        });

        req.flash(
            "success", 
            "Consultation request sent successfully."
        );

        return res.redirect("/auth/contact");

    } catch(error) {

        console.log(error);

        req.flash(
            "error", 
            "failed to send consultation request."
        );

        return res.redirect("/auth/contact");
    }
};

