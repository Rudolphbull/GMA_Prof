const Prediction = require("../models/predictionModel");

exports.index = async (req, res, next) => {
    try {
        const predictions = await Prediction.find({
            isPremium: false
        }).sort({
            kickoffTime: 1
        })
        .lean();

        res.render("home", {
            pageTitle: "Home",
            predictions
        });

    } catch (err) {
        next(err);
    }
};


