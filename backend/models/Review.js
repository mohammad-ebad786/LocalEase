const mongoose = require("mongoose");


// ==================================================
// REVIEW SCHEMA
// ==================================================

const reviewSchema = new mongoose.Schema(
    {
        // ------------------------------------------
        // CUSTOMER
        // ------------------------------------------

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        // ------------------------------------------
        // SERVICE
        // ------------------------------------------

        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },


        // ------------------------------------------
        // BOOKING
        // One booking = One review
        // ------------------------------------------

        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true
        },


        // ------------------------------------------
        // RATING
        // 1 to 5
        // ------------------------------------------

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },


        // ------------------------------------------
        // COMMENT
        // ------------------------------------------

        comment: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        }
    },


    // ------------------------------------------
    // TIMESTAMPS
    // ------------------------------------------

    {
        timestamps: true
    }
);


// ==================================================
// EXPORT REVIEW MODEL
// ==================================================

module.exports = mongoose.model(
    "Review",
    reviewSchema
);