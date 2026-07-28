const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({

    action: {

        type: String,

        required: true

    },

    description: {

        type: String,

        required: true

    },

    icon: {

        type: String,

        default: "bi-activity"

    },

    color: {

        type: String,

        default: "primary"

    },

    createdBy: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User"

    }

}, {

    timestamps: true

});

module.exports = mongoose.model("Activity", activitySchema);