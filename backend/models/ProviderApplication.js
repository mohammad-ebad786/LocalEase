const mongoose = require("mongoose");

// PROVIDER APPLICATION SCHEMA
const providerApplicationSchema = new mongoose.Schema(
    {
        // Provider name
        name: {
            type: String,
            required: true,
            trim: true
        },

        // Phone number
        phone: {
            type: String,
            required: true,
            trim: true
        },

        // Email address
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        // Service location
        location: {
            type: String,
            required: true,
            trim: true
        },

        // Service category
        serviceCategory: {
            type: String,
            required: true,
            trim: true
        },

        // Years of experience
        experience: {
            type: Number,
            required: true,
            min: 0
        },

        // Starting service price
        price: {
            type: Number,
            required: true,
            min: 0
        },

        // Service description
        description: {
            type: String,
            required: true,
            trim: true
        },

        // Application status
        // pending / approved / rejected
        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected"
            ],
            default: "pending"
        },

        // Linked user account after provider registration
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

// CREATE MODEL
const ProviderApplication = mongoose.model(
    "ProviderApplication",
    providerApplicationSchema
);

// EXPORT MODEL
module.exports = ProviderApplication;