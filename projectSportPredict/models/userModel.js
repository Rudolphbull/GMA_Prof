
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["user", "superuser", "admin"],
        default: "user"
    },

    subscriptionStatus: {
    type: String,
    enum: ["inactive", "active", "expired"],
    default: "inactive"
    },

    subscriptionExpiresAt: {
        type: Date,
        default: null
    }

}, {

    timestamps: true

});

module.exports =
    mongoose.model("User", userSchema);