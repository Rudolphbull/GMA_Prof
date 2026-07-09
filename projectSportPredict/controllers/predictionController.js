
const Prediction = require("../models/predictionModel");

exports.newPrediction = (req, res) => {
    res.render("homeForm", {
        pageTitle: "Prediction Form"
    });
};

exports.createPrediction = async (req, res, next) => {
    try {
        const prediction = new Prediction({
            country: req.body.country,
            league: req.body.league,
            homeTeam: req.body.homeTeam,
            awayTeam: req.body.awayTeam,
            prediction: req.body.prediction,
            odds: req.body.odds,
            confidence: req.body.confidence,
            isPremium: req.body.isPremium === "true",
            status: req.body.status,
            kickoffTime: req.body.kickoffTime,
            cardNumber: req.body.cardNumber,
            result: req.body.result,
            createdBy: req.session.user._id
        });

        await prediction.save();

        res.redirect("/");

    } catch (err) {
        next(err);
    }
};