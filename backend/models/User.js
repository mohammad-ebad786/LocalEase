const mongoose = require("mongoose");

// USER SCHEMA
const userSchema = new mongoose.Schema(
    {
        // User name
        name: {
            type: String,
            required: true,
            trim: true
        },

        // Email address
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // Phone number
        phone: {
            type: String,
            required: true,
            trim: true
        },

        // User location
        location: {
            type: String,
            trim: true,
            default: ""
        },

        // Password
        password: {
            type: String,
            required: true
        },

        // User role
        // customer / provider / admin
        role: {
            type: String,
            enum: ["customer", "provider", "admin"],
            default: "customer"
        },

        // Account status
        // Used by Admin to activate/deactivate users
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// EXPORT USER MODEL
module.exports = mongoose.model("User", userSchema);