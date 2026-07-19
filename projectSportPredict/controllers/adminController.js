const Prediction = require("../models/predictionModel");
const User = require("../models/userModel");

exports.dashboard = async (req, res, next) => {

    try {
        const [
            totalPredictions,
            premiumPredictions,
            freePredictions,
            pendingPredictions,
            wonPredictions,
            lostPredictions,
            voidPredictions,
            expiredPredictions,
            totalUsers,
            premiumUsers,
            latestPredictions,
            recentUsers,
            userGrowth,
            predictionGrowth
            
        ]= await Promise.all([

            Prediction.countDocuments(),

            Prediction.countDocuments({
                isPremium: true
            }),

            Prediction.countDocuments({
                isPremium: false
            }),

            Prediction.countDocuments({
                status: "Pending"
            }),

            Prediction.countDocuments({
                status: "Won"
            }),

            Prediction.countDocuments({
                status: "Lost"
            }),

            Prediction.countDocuments({
                status: "Void"
            }),

            Prediction.countDocuments({
                status: "Expired"
            }),

            User.countDocuments(),

            User.countDocuments({
                subscriptionStatus: "active"
            }),

            Prediction.find()
                .sort({ kickoffTime: -1 })
                .limit(5)
                .populate("createdBy", "username"),

            User.find()
                .select("username email role subscriptionStatus createdAt")
                .sort({ createdAt: -1 })
                .limit(5),
            
            User.aggregate([

                {
                    $group: {

                        _id: {

                            year: { $year: "$createdAt" },

                            month: { $month: "$createdAt" }

                        },

                        total: {

                            $sum: 1

                        }

                    }

                },

                {
                    $sort: {

                        "_id.year": 1,

                        "_id.month": 1

                    }

                }

            ]),


            Prediction.aggregate([

                {
                    $group: {

                        _id: {

                            year: { $year: "$createdAt" },

                            month: { $month: "$createdAt" }

                        },

                        total: {

                            $sum: 1

                        }

                    }

                },

                {
                    $sort: {

                        "_id.year": 1,

                        "_id.month": 1

                    }

                }

            ])
            ]);


        const growthLabels = userGrowth.map(item => {

            return new Date(
                item._id.year,
                item._id.month - 1
            ).toLocaleString("en-NG", {

                month: "short",
                year: "2-digit"

            });

        });


        const growthData = userGrowth.map(item => item.total);


        const predictionGrowthLabels = predictionGrowth.map(item => {

            return new Date(
                item._id.year,
                item._id.month - 1
            ).toLocaleString("en-NG", {

                month: "short",
                year: "2-digit"

            });

        });

        const predictionGrowthData = predictionGrowth.map(item => item.total);

        const completedPredictions =
        wonPredictions +
        lostPredictions +
        voidPredictions +
        expiredPredictions;

        const winRate = completedPredictions
        ? ((wonPredictions / completedPredictions) * 100).toFixed(1)
        : 0;

        const lossRate = completedPredictions
            ? ((lostPredictions / completedPredictions) * 100).toFixed(1)
            : 0;

        const voidRate = completedPredictions
            ? ((voidPredictions / completedPredictions) * 100).toFixed(1)
            : 0;

        const expiredRate = completedPredictions
            ? ((expiredPredictions / completedPredictions) * 100).toFixed(1)
            : 0;

        res.render("admin/dashboard", {

            pageTitle: "Admin Dashboard",

            totalPredictions,
            premiumPredictions,
            freePredictions,

            pendingPredictions,
            wonPredictions,
            lostPredictions,
            voidPredictions,
            expiredPredictions,

            totalUsers,
            premiumUsers,

            latestPredictions,

            recentUsers,

            completedPredictions,

            winRate,
            lossRate,
            voidRate,
            expiredRate,

            growthLabels,
            growthData,

            predictionGrowthLabels,
            predictionGrowthData

        });
        
    } catch(err){

        next(err);

    }

};