const Prediction = require("../../models/predictionModel");
const expirePredictions = require("../../utils/expirePredictions");

exports.predictions = async (req, res, next) => {

    try {

        await expirePredictions();

        const search = req.query.search || "";

        const status = req.query.status || "";

        const premium = req.query.premium || "";

        const country = req.query.country || "";

        const league = req.query.league || "";

        const sort = req.query.sort || "kickoff-desc";

        const minOdds = req.query.minOdds || "";

        const maxOdds = req.query.maxOdds || "";

        const dateFrom = req.query.dateFrom || "";

        const dateTo = req.query.dateTo || "";

        const page = parseInt(req.query.page) || 1;

        const limit = 10;

        const skip = (page - 1) * limit;

        const filter = {};


        if (search) {

            filter.$or = [

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
                },

                {
                    country: {
                        $regex: search,
                        $options: "i"
                    }
                }

            ];

        }

        if (status) {

            filter.status = status;

        }

        if (premium) {

            filter.isPremium = premium === "true";

        }


        if (country) {

            filter.country = country;

        }

        if (league) {

            filter.league = league;

        }

        if (minOdds || maxOdds) {

            filter.odds = {};

            if (minOdds) {

                filter.odds.$gte = parseFloat(minOdds);

            }

            if (maxOdds) {

                filter.odds.$lte = parseFloat(maxOdds);

            }

        }


        if (dateFrom || dateTo) {

            filter.kickoffTime = {};

            if (dateFrom) {

                filter.kickoffTime.$gte = new Date(dateFrom);

            }

            if (dateTo) {

                const endDate = new Date(dateTo);

                endDate.setHours(23,59,59,999);

                filter.kickoffTime.$lte = endDate;

            }

        }


        let sortOption = {};

            switch (sort) {

                case "kickoff-asc":
                    sortOption = { kickoffTime: 1 };
                    break;

                case "kickoff-desc":
                    sortOption = { kickoffTime: -1 };
                    break;

                case "odds-asc":
                    sortOption = { odds: 1 };
                    break;

                case "odds-desc":
                    sortOption = { odds: -1 };
                    break;

                case "confidence-desc":
                    sortOption = { confidence: -1 };
                    break;

                case "confidence-asc":
                    sortOption = { confidence: 1 };
                    break;

                case "created-desc":
                    sortOption = { createdAt: -1 };
                    break;

                case "created-asc":
                    sortOption = { createdAt: 1 };
                    break;

                default:
                    sortOption = { kickoffTime: -1 };

            }



        const [predictions, totalPredictions, countries, leagues] = await Promise.all([
            Prediction.find(filter)
                .populate("createdBy", "username")
                .sort(sortOption)
                .skip(skip)
                .limit(limit),

            Prediction.countDocuments(filter),

            Prediction.distinct("country"),

            Prediction.distinct("league")
        ]);

        const cleanCountries = countries.filter(Boolean);
        const cleanLeagues = leagues.filter(Boolean);


        const totalPages = Math.ceil(totalPredictions / limit);


        res.render("admin/predictions", {

            pageTitle: "Manage Predictions",

            predictions,

            countries: cleanCountries,

            leagues: cleanLeagues,

            search,

            status,

            premium,

            country,

            league,

            currentPage: page,

            totalPages,

            totalPredictions,

            limit,

            minOdds,

            maxOdds,

            dateFrom,

            dateTo,

            sort

        });

    } catch (err) {

        next(err);

    }

};


exports.bulkAction = async (req, res, next) => {

    try {

        let { predictionIds, action } = req.body;


        // Nothing selected
        if (!predictionIds) {

            req.flash(
                "warning",
                "Please select at least one prediction."
            );

            return res.redirect("/admin/predictions");

        }

        // Convert single checkbox to array
        if (!Array.isArray(predictionIds)) {

            predictionIds = [predictionIds];

        }

        
        let message = "";

        switch (action) {

            case "won":

                await Prediction.updateMany(
                    { _id: { $in: predictionIds } },
                    { status: "Won" }
                );

                message = `${predictionIds.length} prediction(s) marked as Won.`;
                break;

            case "lost":

                await Prediction.updateMany(
                    { _id: { $in: predictionIds } },
                    { status: "Lost" }
                );

                message = `${predictionIds.length} prediction(s) marked as Lost.`;
                break;

            case "void":

                await Prediction.updateMany(
                    { _id: { $in: predictionIds } },
                    { status: "Void" }
                );

                message = `${predictionIds.length} prediction(s) marked as Void.`;
                break;

            case "premium":

                await Prediction.updateMany(
                    { _id: { $in: predictionIds } },
                    { isPremium: true }
                );

                message = `${predictionIds.length} prediction(s) upgraded to Premium.`;
                break;

            case "free":

                await Prediction.updateMany(
                    { _id: { $in: predictionIds } },
                    { isPremium: false }
                );

                message = `${predictionIds.length} prediction(s) changed to Free.`;
                break;

            case "delete":

                await Prediction.deleteMany({
                    _id: { $in: predictionIds }
                });

                message = `${predictionIds.length} prediction(s) deleted successfully.`;
                break;

            default:

                req.flash("error", "Invalid bulk action.");

                return res.redirect("/admin/predictions");
        }

        req.flash("success", message);

        res.redirect("/admin/predictions");

    } catch (err) {

        next(err);

    }

};

exports.deletePrediction = async (req, res, next) => {

    try {

        const prediction = await Prediction.findById(req.params.id);

        if (!prediction) {

            const err = new Error("Prediction not found.");

            err.status = 404;

            err.details =
                "The prediction you are trying to delete no longer exists.";

            return next(err);

        }

        await Prediction.findByIdAndDelete(req.params.id);

        req.flash(
            "success", 
            "Prediction deleted successfully."
        );

        res.redirect("/admin/predictions");

    } catch (err) {

        next(err);

    }

};