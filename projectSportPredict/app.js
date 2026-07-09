require("dotenv").config();

const express = require("express");
const session = require("express-session");

const { MongoStore } = require("connect-mongo");

const homeRoutes = require("./routes/homeRoutes");

const authRoutes = require("./routes/authRoutes");

const adminRoutes = require("./routes/adminRoutes");


const predictionRoutes = require("./routes/predictionRoutes");


const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));



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
            maxAge: 1000 * 60 * 60 * 24
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

app.get("/moneyDoublersOnly", (req, res)=>{
    res.render("login", {pageTitle: "MoneyDoublersOnly"});
});

app.get("/yesterdaysresults", (req, res)=>{
    res.render("yesterday", {pageTitle: "Yesterdays Result"});
});


app.get("/login", (req, res)=>{
    res.render("login", {pageTitle: "Login"});
});

app.get("/signup", (req, res)=>{
    res.render("signup", {pageTitle: "Signup"});
});

app.get("/career", (req, res)=>{
    res.render("career", {pageTitle: "Career"});
});

app.get("/about", (req, res) => {
    res.render("about", {pageTitle: "About"});
});

app.get("/contact", (req, res) => {
    res.render("contact", {pageTitle: "Contact"});
});

app.get("/success", (req, res) => {
    res.render("success", {pageTitle: "Success"});
});

app.get("/failure", (req, res) => {
    res.render("failure", {pageTitle: "Failure"});
});

app.get("/failureLogin", (req, res) => {
    res.render("failureLogin", {pageTitle: "Login Failure"});
});

app.get("/homeForm", (req, res) => {
    res.render("homeForm", {pageTitle: "Prediction Form"});
})



module.exports = app;