require("dotenv").config();

const express = require("express");
const session = require("express-session");

const path = require("path");

const { MongoStore } = require("connect-mongo");

const flash = require("connect-flash");

const homeRoutes = require("./routes/homeRoutes");

const authRoutes = require("./routes/authRoutes");

const adminRoutes = require("./routes/adminRoutes");


const predictionRoutes = require("./routes/predictionRoutes");



// creating a local module to send email
const sendTheEmail = require(path.join(__dirname, "/email.js")); 

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));



app.locals.siteName = "Prof Predict";
app.locals.tagline = "Stakers Krooner";

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        }
    })
);


app.use(flash());

app.use((req, res, next) => {

    res.locals.user = req.session.user || null;

    res.locals.success = req.flash("success");

    res.locals.error = req.flash("error");

    res.locals.warning = req.flash("warning");

    next();

});


app.use("/auth", authRoutes);

app.use("/", homeRoutes);

app.use("/admin", adminRoutes);

app.use("/predictions", predictionRoutes);



//404 middleware
app.use((req, res) => {

    res.status(404).render("404", {

        pageTitle: "404 - Page Not Found"

    });

});



// Otherwise render 500

// Global Error Handler
app.use((err, req, res, next) => {

    console.error("Global Error Handler:");
    console.error(err);

    const status = err.status || 500;

    // Handle 403 and 404 with the reusable error page
    if (status === 403 || status === 404) {

        return res.status(status).render("404", {

            pageTitle:
                status === 403
                    ? "403 - Access Denied"
                    : "404 - Page Not Found",

            message: err.message,

            details: err.details

        });

    }

    // Handle all other server errors
    return res.status(500).render("500", {

        pageTitle: "500 - Internal Server Error",

        message:
            process.env.NODE_ENV === "production"
                ? "Oops! Something went wrong while processing your request."
                : err.message,

        details:
            process.env.NODE_ENV === "production"
                ? "Please try again later. If the problem persists, contact our support team."
                : "An unexpected error occurred while processing this request.",

        error:
            process.env.NODE_ENV === "production"
                ? null
                : err

    });

});

module.exports = app;