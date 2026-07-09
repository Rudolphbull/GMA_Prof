const Prediction = require("../models/predictionModel");

exports.premium = async (req, res, next) => {
    try {

        const predictions = await Prediction.find({
            isPremium: true
        })
        .sort({
            kickoffTime: 1
        })
        .lean();

        res.render("premium", {
            pageTitle: "Premium Predictions",
            predictions
        });

    } catch (err) {
        next(err);
    }
};