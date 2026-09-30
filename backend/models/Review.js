const mongoose = require("mongoose");

// REVIEW SCHEMA
const reviewSchema = new mongoose.Schema(
    {
        // Customer who submitted the review
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Reviewed service
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },

        // Booking associated with the review
        // One booking = One review
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true
        },

        // Rating from 1 to 5
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        // Review comment
        comment: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// EXPORT REVIEW MODEL
module.exports = mongoose.model(
    "Review",
    reviewSchema
);