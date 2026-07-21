const Prediction = require("../models/predictionModel");

const expirePredictions = async () => {
    try {

        const now = new Date();

        const result = await Prediction.updateMany(
            {
                status: "Pending",

                kickoffTime: {
                    $lt: now
                }
            },

            {
                $set: {
                    status: "Expired"
                }
            }
        );

        return result;

    } catch (error) {

        console.error("Error expiring predictions:", error);

        throw error;

    }
};

module.exports = expirePredictions;