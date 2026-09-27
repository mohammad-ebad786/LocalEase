const mongoose = require("mongoose");


// ==================================================
// PROVIDER APPLICATION SCHEMA
// ==================================================

const providerApplicationSchema = new mongoose.Schema(
    {

        // ==============================================
        // PROVIDER NAME
        // ==============================================

        name: {
            type: String,
            required: true,
            trim: true
        },


        // ==============================================
        // PHONE
        // ==============================================

        phone: {
            type: String,
            required: true,
            trim: true
        },


        // ==============================================
        // EMAIL
        // ==============================================

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },


        // ==============================================
        // SERVICE LOCATION
        // ==============================================

        location: {
            type: String,
            required: true,
            trim: true
        },


        // ==============================================
        // SERVICE CATEGORY
        // ==============================================

        serviceCategory: {
            type: String,
            required: true,
            trim: true
        },


        // ==============================================
        // EXPERIENCE
        // ==============================================

        experience: {
            type: Number,
            required: true,
            min: 0
        },


        // ==============================================
        // STARTING PRICE
        // ==============================================

        price: {
            type: Number,
            required: true,
            min: 0
        },


        // ==============================================
        // SERVICE DESCRIPTION
        // ==============================================

        description: {
            type: String,
            required: true,
            trim: true
        },


        // ==============================================
        // APPLICATION STATUS
        // pending / approved / rejected
        // ==============================================

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected"
            ],
            default: "pending"
        },


        // ==============================================
        // LINKED USER
        // Added after provider account is created
        // ==============================================

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


// ==================================================
// CREATE MODEL
// ==================================================

const ProviderApplication = mongoose.model(
    "ProviderApplication",
    providerApplicationSchema
);


// ==================================================
// EXPORT MODEL
// ==================================================

module.exports = ProviderApplication;