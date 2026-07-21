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

        const minOdds = req.query.minOdds || "";

        const maxOdds = req.query.maxOdds || "";

        const dateFrom = req.query.dateFrom || "";

        const dateTo = req.query.dateTo || "";

        const page = parseInt(req.query.page) || 1;

        const limit = 10;

        const skip = (page - 1) * limit;

        const filters = {};


        if (search) {

            filters.$or = [

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

        if (minOdds || maxOdds) {

            filters.odds = {};

            if (minOdds) {

                filters.odds.$gte = parseFloat(minOdds);

            }

            if (maxOdds) {

                filters.odds.$lte = parseFloat(maxOdds);

            }

        }


        if (dateFrom || dateTo) {

            filters.kickoffTime = {};

            if (dateFrom) {

                filters.kickoffTime.$gte = new Date(dateFrom);

            }

            if (dateTo) {

                const endDate = new Date(dateTo);

                endDate.setHours(23,59,59,999);

                filters.kickoffTime.$lte = endDate;

            }

        }


        const [predictions, totalPredictions, countries, leagues] = await Promise.all([
            Prediction.find(filters)
                .populate("createdBy", "username")
                .sort({ kickoffTime: -1 })
                .skip(skip)
                .limit(limit),

            Prediction.countDocuments(filters),

            Prediction.distinct("country"),

            Prediction.distinct("league")
        ]);

        const cleanCountries = countries.filter(Boolean);
        const cleanLeagues = leagues.filter(Boolean);


        const totalPages = Math.ceil(totalPredictions / limit);

        console.log(countries);
        console.log(leagues);

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

            dateTo

        });

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