const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({

    country: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    league: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    homeTeam: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    awayTeam: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    analysis: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ""
    },

    prediction: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    odds: {
        type: Number,
        required: true,
        min: 1.01
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
    enum: [
        "Pending",
        "Expired",
        "Won",
        "Lost",
        "Void"
    ],
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
        ref: "User",
        required: true
    }

}, {

    timestamps: true

});


predictionSchema.index({
    country: 1,
    league: 1,
    status: 1,
    kickoffTime: 1
});


predictionSchema.virtual("expired").get(function () {
    return this.kickoffTime < new Date();
});


module.exports = mongoose.model("Prediction", predictionSchema);