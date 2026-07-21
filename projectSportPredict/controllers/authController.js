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

            req.flash(
                "error",
                "Invalid username/email or password."
            );

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
                "user not found."
            );

        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!passwordMatch) {

            req.flash(
                "error",
                "password mismatch."
            );

        }

        // Create a session
        req.session.user = {
            _id: user._id,
            username: user.username.toLowerCase().trim(),
            email: user.email.toLowerCase().trim(),
            role: user.role || "user"
        };

        console.log(req.session.user);

        req.flash(
            "success", 
            "Login Successful."
        );

        // Redirect to the dashboard
        res.redirect("/predictions/premium");

    } catch (err) {

        console.error(err);

        req.flash(
            "error",
            "Invalid username/email or password."
        );

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

            req.flash(
                "error",
                "All fields are required."
            );


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

            req.flash(
                "error",
                "User already exists"
            );


        }

        const user = new User({

            username: req.body.username.toLowerCase().trim(),

            email: req.body.email.toLowerCase().trim(),

            password: hashedPassword,

            role: "user"

        });

        await user.save();

        req.flash(
            "success", 
            "Account created successfully, please login."
        );
        
        return res.redirect("/auth/login");

    }

    catch(err){

        console.error(err);

        req.flash(
            "error",
            "An unexpected error occured."
        );


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
            "All fields are required."
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
            "All fields are required."
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

