
const Prediction = require("../models/predictionModel");
const expirePredictions = require("../utils/expirePredictions");
const logActivity = require("../utils/activityLogger");

exports.newPrediction = (req, res) => {
    res.render("predictions", {
        pageTitle: "Prediction Form",
        prediction: null,
        redirectTo: "/"
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

            req.flash(
                "error",
                "Please complete all required fields."
            );

            return res.redirect("/predictions/new");
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

        await logActivity({
            action: "Prediction Created",
            description: `${newPrediction.homeTeam} vs ${newPrediction.awayTeam}`,
            icon: "bi-plus-circle-fill",
            color: "success",
            createdBy: req.session.user._id
        });
        

        req.flash(
            "success", 
            "Prediction created successfully."
        );

        if (newPrediction.isPremium) {
            return res.redirect("/predictions/premium");
        }

        return res.redirect("/");


    } catch (err) {
        next(err);
    }
};



exports.editPrediction = async (req, res, next) => {
    try {

        const prediction = await Prediction.findById(req.params.id);

        if (!prediction) {

            return res.status(404).render("404", {

                    pageTitle: "Prediction Not Found",

                    message: "The requested prediction does not exist.",

                    details: "It may have been deleted or the URL is incorrect."

                });
            }

        res.render("predictions", {
            pageTitle: "Prediction Form",
            prediction,
            redirectTo: req.query.redirectTo || "/"
        });

    } catch (err) {
        next(err);
    }
};


exports.updatePrediction = async (req, res, next) => {
    const { redirectTo } = req.body;
   
    try {

        const updatedPrediction = await Prediction.findByIdAndUpdate(
            
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

        if (!updatedPrediction) {

            const err = new Error("Prediction not found.");

            err.status = 404;

            return next(err);

        }

        await logActivity({
            action: "Prediction Updated",
            description: `${updatedPrediction.homeTeam} vs ${updatedPrediction.awayTeam}`,
            icon: "bi-pencil-square",
            color: "info",
            createdBy: req.session.user._id
        });

        req.flash(
            "success", 
            "Prediction updated successfully."
        );

        res.redirect(redirectTo || "/");

    } catch (err) {
        next(err);
    }
};


exports.deletedPrediction = async (req, res, next) => {
    const { redirectTo } = req.body;
    try {

        await Prediction.findByIdAndDelete(req.params.id);

        await logActivity({
            action: "Prediction Deleted",
            description: `${deletedPrediction.homeTeam} vs ${deletedPrediction.awayTeam}`,
            icon: "bi-trash-fill",
            color: "danger",
            createdBy: req.session.user._id
        });

        req.flash("success", "Prediction deleted successfully.");

        res.redirect(redirectTo || "/");

    } catch (err) {
        next(err);
    }
};



exports.yesterdaysresults = async (req, res, next) => {
    try {

        await expirePredictions();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const predictions = await Prediction.find({
            kickoffTime: {
                $gte: yesterday,
                $lt: today
            },

            status: {
                $in: [
                    "Won",
                    "Lost",
                    "Void",
                    "Expired"
                ]
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

        res.render("predictions/yesterday", {
            pageTitle: "Yesterday's Results",
            predictions,
            stats
        });

    } catch (err) {
        next(err);
    }
};


exports.premium = async (req, res, next) => {
    try {

        await expirePredictions();

        const predictions = await Prediction.find({
            isPremium: true
        })
        .populate("createdBy", "username")
        .sort({
            kickoffTime: 1
        })
        .lean();

        res.render("predictions/premium", {
            pageTitle: "Premium Predictions",
            predictions
        });

    } catch (err) {
        next(err);
    }
};
