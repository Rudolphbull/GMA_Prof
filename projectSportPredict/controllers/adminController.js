const Prediction = require("../models/predictionModel");
const User = require("../models/userModel");
const expirePredictions = require("../utils/expirePredictions");





exports.predictions = async (req, res, next) => {

    try {

        await expirePredictions();

        const search = req.query.search || "";

        const status = req.query.status || "";

        const premium = req.query.premium || "";

        const page = parseInt(req.query.page) || 1;

        const limit = 10;

        const skip = (page - 1) * limit;

        const query = {};

        if (search) {

            query.$or = [

                {
                    homeTeam: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    awayTeam: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    league: {
                        $regex: search,
                        $options: "i"
                    }
                }

            ];

        }

        if (status) {

            query.status = status;

        }

        if (premium) {

            query.isPremium = premium === "true";

        }

        const [predictions, totalPredictions] = await Promise.all([

            Prediction.find(query)
                .sort({ kickoffTime: -1 })
                .populate("createdBy", "username")
                .skip(skip)
                .limit(limit),

            Prediction.countDocuments(query)

        ]);

        const totalPages = Math.ceil(totalPredictions / limit);

        res.render("admin/predictions", {

            pageTitle: "Manage Predictions",

            predictions,

            search,

            status,

            premium,

            currentPage: page,

            totalPages,

            totalPredictions,

            limit

        });

    } catch (err) {

        next(err);

    }

};


