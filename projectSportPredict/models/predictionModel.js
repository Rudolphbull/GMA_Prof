const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({

    country: {
        type: String,
        required: true,
        trim: true
    },

    league: {
        type: String,
        required: true,
        trim: true
    },

    homeTeam: {
        type: String,
        required: true,
        trim: true
    },

    awayTeam: {
        type: String,
        required: true,
        trim: true
    },

    prediction: {
        type: String,
        required: true,
        trim: true
    },

    odds: {
        type: Number,
        required: true,
        min: 1
    },

    confidence: {
        type: Number,
        min: 1,
        max: 100,
        default: 80
    },

    isPremium: {
        type: Boolean,
        default: false
    },

    status: {
        type: String,
        enum: ["Pending", "Won", "Lost", "Void"],
        default: "Pending"
    },

    kickoffTime: {
        type: Date,
        required: true
    },

    cardNumber: {
    type: String,
    enum: [
        "cardOne",
        "cardTwo",
        "cardThree",
        "cardFour",
        "cardFive",
        "cardSix"
    ],
    required: true
    },

    result: {
        type: String,
        default: ""
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, {

    timestamps: true

});

predictionSchema.index({
    kickoffTime: 1
});

module.exports = mongoose.model("Prediction", predictionSchema);