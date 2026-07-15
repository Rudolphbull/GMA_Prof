
const Prediction = require("../models/predictionModel");

exports.newPrediction = (req, res) => {
    res.render("homeForm", {
        pageTitle: "Prediction Form"
    });
};

exports.createPrediction = async (req, res, next) => {
    try {

        const {
            country,
            league,
            homeTeam,
            awayTeam,
            prediction,
            analysis,
            odds,
            confidence,
            isPremium,
            status,
            kickoffTime,
            cardNumber,
            result
        } = req.body;

        const requiredFields = [
            country,
            league,
            homeTeam,
            awayTeam,
            prediction,
            analysis,
            odds,
            confidence,
            kickoffTime,
            cardNumber
        ];

        if (requiredFields.some(field => !field)) {
            return res.render("homeForm", {
                pageTitle: "Prediction Form",
                message: "Please complete all required fields."
            });
        }

        const newPrediction = new Prediction({
            country,
            league,
            homeTeam,
            awayTeam,
            prediction,
            analysis,
            odds,
            confidence,
            isPremium: isPremium === "true",
            status,
            kickoffTime,
            cardNumber,
            result,
            createdBy: req.session.user._id
        });

        await newPrediction.save();

        res.redirect("/");

    } catch (err) {
        next(err);
    }
};



exports.editPrediction = async (req, res, next) => {
    try {

        const prediction = await Prediction.findById(req.params.id);

        if (!prediction) {
            return res.status(404).render("failure", {
                pageTitle: "Not Found",
                message: "Prediction not found."
            });
        }

        res.render("homeForm", {
            pageTitle: "Prediction Form",
            prediction
        });

    } catch (err) {
        next(err);
    }
};


exports.updatePrediction = async (req, res, next) => {
    console.log(req.body);
    try {

        await Prediction.findByIdAndUpdate(
            req.params.id,
            {
                country: req.body.country,
                league: req.body.league,
                homeTeam: req.body.homeTeam,
                awayTeam: req.body.awayTeam,
                prediction: req.body.prediction,
                analysis: req.body.analysis,
                odds: req.body.odds,
                confidence: req.body.confidence,
                isPremium: req.body.isPremium === "true",
                status: req.body.status,
                kickoffTime: req.body.kickoffTime,
                result: req.body.result,
                cardNumber: req.body.cardNumber
            },
            {
                new: true,
                runValidators: true
            }
        );

        res.redirect("/");

    } catch (err) {
        next(err);
    }
};


exports.deletePrediction = async (req, res, next) => {
    try {

        await Prediction.findByIdAndDelete(req.params.id);

        res.redirect("/");

    } catch (err) {
        next(err);
    }
};


