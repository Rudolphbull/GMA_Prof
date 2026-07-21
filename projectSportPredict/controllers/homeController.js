const Prediction = require("../models/predictionModel");

const expirePredictions = require("../utils/expirePredictions");

exports.index = async (req, res, next) => {
    try {

        await expirePredictions();
        const predictions = await Prediction.find({
            isPremium: false
        })
        .populate("createdBy", "username")
        .sort({
            kickoffTime: 1
        })
        .lean();

        res.render("predictions/home", {
            pageTitle: "Home",
            predictions
        });

    } catch (err) {
        next(err);
    }
};


