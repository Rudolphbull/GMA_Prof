const bcrypt = require("bcrypt");

const User = require("../models/userModel");


exports.login = async (req, res) => {

    try {

        // Validate input first
        if (!req.body.login || !req.body.password) {

            return res.render("failureLogin", {
                pageTitle: "Failure Login"
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
                pageTitle: "Failure Login"
            });

        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!passwordMatch) {

            return res.render("failureLogin", {
                pageTitle: "Failure Login"
            });

        }

        // Create a session
        req.session.user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role || "user"
        };

        // Redirect to the dashboard
        res.redirect("/todaysbookings");

    } catch (err) {

        console.error(err);

        res.render("failureLogin", {
            pageTitle: "Failure Login"
        });

    }

};



exports.signup = async (req, res) => {

    try {

        if (req.body.password !== req.body.confirmPassword) {

            return res.render("failure", {
                pageTitle: "Failure"
            });

        }

        const hashedPassword =
            await bcrypt.hash(req.body.password, 10);


        const existingUser = await User.findOne({
                
            $or: [
                { username: req.body.username },
                { email: req.body.email }
            ]
        });

        if (existingUser) {

            return res.render("failure", {
                pageTitle: "User Already Exists"
            });

        }

        const user = new User({

            username: req.body.username,

            email: req.body.email,

            password: hashedPassword

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

            message: "An unexpected error occured."

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