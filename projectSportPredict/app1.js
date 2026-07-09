
const express = require("express");

const path = require("path");

const mongoose = require("mongoose");

const ejs = require("ejs");

const Port = 4000;

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public")));


app.locals.siteName = "Prof Predict";
app.locals.tagline = "Stakers Krooner";



// Connect DB

mongoose.connect("mongodb://localhost:27017/profpredictDB", {useNewUrlParser: true, useUnifiedTopology: true}).then(()=>{
    console.log("DB connected successfully to profpredictDB...");
    app.listen(process.env.Port || 4000, ()=>{
        console.log("Application Server started on port:", Port);
    });
}).catch((err)=>{
    console.log("failed to connect to profpredictDB!!!" + err.message);
});

// create Schema

const profpredictSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is required"]
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "password is required"]
    },
    confirmPassword: {
        type: String,
        required: [true, "confirm password is required"]
    },

    role: {
        type: String,
        default: "user"
    }
},
{
    timestamps: true
});


//Prediction Schema
const predictionSchema = new mongoose.Schema({

    tournament: {
        type: String,
        required: true
    },

    league: {
        type: String,
        required: true
    },

    homeTeam: {
        type: String,
        required: true
    },

    awayTeam: {
        type: String,
        required: true
    },

    prediction: {
        type: String,
        required: true
    },

    cardNumber: {
        type: String,
        required: true
    }

},
{
    timestamps: true
});

// create Model

const profpredictModel = mongoose.model("staker", profpredictSchema);

const Prediction = mongoose.model("Prediction", predictionSchema);

// add data to database

// const Rudolphbull = new profpredictModel({
//     username: "rudolphbull",
//     email: "rudolphbull@gmail.com",
//     password: "Welcome123@",
//     confirmPassword: "Welcome123@"
// });

// const GMA = new profpredictModel({
//     username: "gma",
//     email: "gma@gmail.com",
//     password: "Welcome432@",
//     confirmPassword: "Welcome432@"
// });

// const Prof = new profpredictModel({
//     username: "prof",
//     email: "prof@gmail.com",
//     password: "Welcome321@",
//     confirmPassword: "Welcome321@"
// });

// const defaultNames = [Rudolphbull, GMA, Prof];
// profpredictModel.insertMany(defaultNames).then((stakers)=>{
//     console.log("Stakers information added to the database...");
//     console.log(stakers);
// }).catch((err)=>{
//     console.log("Failed to add stakers information to the database!!" + err.message);
// });

// Routes

app.get("/", async(req, res) => {

    const predictions = await Prediction.find().sort({ createdAt: 1 });

    res.render("home", {
        pageTitle: "Home",
        predictions
    });

});


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

app.get("contact", (req, res) => {
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

app.post("/", async (req, res) => {

    try {

        const prediction = new Prediction({

            tournament: req.body.tournamentName,

            league: req.body.leagueName,

            homeTeam: req.body.homeTeam,

            awayTeam: req.body.awayTeam,

            prediction: req.body.predictionA,

            cardNumber: req.body.cardNumber

        });

        await prediction.save();

        res.redirect("/");

    } catch (err) {

        console.log(err);

        res.status(500).send("Failed to save prediction.");

    }

});


app.post("/signup", async(req, res)=>{

    const data = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    }

    await profpredictModel.insertMany([data]).then((stakers)=>{

            if (stakers) {
                res.render("success", {pageTitle: "Success"});
            } else{
                res.render("failure", {pageTitle: "Failure"});
            }
        }).catch((err)=>{
            res.send("Failed to add stakers information to the database!!" + err.message);
        });

});


app.post("/login", async (req, res) => {

    try {

        const user = await profpredictModel.findOne({
            $or: [
                { username: req.body.login },
                { email: req.body.login }
            ]
        });

        if (!user) {
            return res.render("failureLogin", {
                pageTitle: "Failure Login"
            });
        }

        if (user.password !== req.body.password) {
            return res.render("failureLogin", {
                pageTitle: "Failure Login"
            });
        }

        res.render("todaysbookings", {
            pageTitle: "Today's Bookings"
        });

    } catch (err) {

        console.log(err);

        res.render("failureLogin", {
            pageTitle: "Failure Login"
        });

    }

});


