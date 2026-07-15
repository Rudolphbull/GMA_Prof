const bcrypt = require("bcrypt");

const Prediction = require("../models/predictionModel");

const User = require("../models/userModel");

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

            return res.render("failureLogin", {
                pageTitle: "Failure Login",

                message: "Invalid username/email or password."
            });

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

            return res.render("failureLogin", {
                pageTitle: "Failure Login",

                message: "Invalid username/email or password."
            });

        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!passwordMatch) {

            return res.render("failureLogin", {
                pageTitle: "Failure Login",

                message: "Invalid username/email or password.."
            });

        }

        // Create a session
        req.session.user = {
            _id: user._id,
            username: user.username.toLowerCase().trim(),
            email: user.email.toLowerCase().trim(),
            role: user.role || "user"
        };

        console.log("Session after login:", req.session.user);

        // Redirect to the dashboard
        res.redirect("/auth/premium");

    } catch (err) {

        console.error(err);

        res.render("failureLogin", {
            pageTitle: "Failure Login",

            message: "An unexpected error occurred."
        });

    }

};



exports.signup = async (req, res) => {

    try {


        if (
            !req.body.username.toLowerCase().trim() ||
            !req.body.email.toLowerCase().trim() ||
            !req.body.password ||
            !req.body.confirmPassword
        ) {

            return res.render("failure", {
                pageTitle: "Failure",

                message: "Password and Confirm Password does not Match."
            });

        }

        const hashedPassword =
            await bcrypt.hash(req.body.password, 10);


        const existingUser = await User.findOne({
                
            $or: [
                { username: req.body.username },
                { email: req.body.email.toLowerCase().trim() }
            ]
        });

        if (existingUser) {

            return res.render("failure", {
                pageTitle: "User Already Exists",

                message: "User Already Exists."
            });

        }

        const user = new User({

            username: req.body.username.toLowerCase().trim(),

            email: req.body.email.toLowerCase().trim(),

            password: hashedPassword,

            role: "user"

        });

        await user.save();

        res.render("success", {
            pageTitle: "Success"
        });

    }

    catch(err){

        console.error(err);

        return res.render("failure", {

            pageTitle: "Failure",

            message: "An unexpected error occurred."

        });

    }

};


exports.logout = (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            console.error(err);
            return res.redirect("/");
        }

        res.clearCookie("connect.sid");
        res.redirect("/");

    });

};



exports.premium = async (req, res, next) => {
    try {

        const predictions = await Prediction.find({
            isPremium: true
        })
        .populate("createdBy", "username")
        .sort({
            kickoffTime: 1
        })
        .lean();

        res.render("premium", {
            pageTitle: "Premium Predictions",
            predictions
        });

    } catch (err) {
        next(err);
    }
};

exports.homeForm = (req, res) => {

    res.render("homeForm", {
        pageTitle: "Prediction Form",
        prediction: null
    });

};

exports.yesterdaysresults = async (req, res, next) => {
    try {

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const predictions = await Prediction.find({
            kickoffTime: {
                $gte: yesterday,
                $lt: today
            }
        })
        .populate("createdBy", "username")
        .sort({ kickoffTime: 1 })
        .lean();

        const stats = {
            total: predictions.length,
            won: predictions.filter(p => p.status === "Won").length,
            lost: predictions.filter(p => p.status === "Lost").length,
            void: predictions.filter(p => p.status === "Void").length,
            pending: predictions.filter(p => p.status === "Pending").length
        };

        stats.accuracy =
            (stats.won + stats.lost + stats.void) > 0
                ? ((stats.won / (stats.won + stats.lost + stats.void)) * 100).toFixed(1)
                : 0;

        res.render("yesterday", {
            pageTitle: "Yesterday's Results",
            predictions,
            stats
        });

    } catch (err) {
        next(err);
    }
};


exports.failure = (req, res) => {
    res.render("failure", {
        pageTitle: "Failure",
        message: "An unexpected error occurred."
    });
};


exports.success = (req, res) => {
    res.render("success", {pageTitle: "Success"});
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
        return res.render("invalid", {pageTitle: "Invalid"});
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

        res.render("successMessage", {pageTitle: "success"});

    } catch(error) {

        console.log(error);

        res.render("failureMessage", {pageTitle: "failure"});
    }
};



exports.booking = async function(req, res) {

    const { companyName, email, phone, enquiry, details } = req.body;

    if (!companyName || !email || !phone || !enquiry || !details) {
        return res.render("invalid", {pageTitle: "Invalid"});
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

        res.render("successBooking", {pageTitle: "successBooking"});

    } catch(error) {

        console.log(error);

        res.render("failureBooking", {pageTitle: "failureBooking"});
    }
};

