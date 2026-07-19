require("dotenv").config();

const express = require("express");
const session = require("express-session");

const path = require("path");

const { MongoStore } = require("connect-mongo");

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

app.use((req, res, next) => {

    res.locals.user = req.session.user || null;

    next();

});

app.use("/auth", authRoutes);

app.use("/", homeRoutes);

app.use("/admin", adminRoutes);

app.use("/predictions", predictionRoutes);



//404 middleware
app.use((req, res) => {
    res.status(404).render("404", {
        pageTitle: "Page Not Found"
    });
});

//Global Error Handler
app.use((err, req, res, next) => {
    console.log("Global error handler");
    console.error(err);

    res.status(500).render("500", {
        pageTitle: "Error",
        message: err.message
    });
});



module.exports = app;