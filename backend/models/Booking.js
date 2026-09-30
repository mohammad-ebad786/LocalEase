const mongoose = require("mongoose");

// BOOKING SCHEMA
const bookingSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },

        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        bookingDate: {
            type: Date,
            required: true
        },

        address: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        notes: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "in-progress",
                "completed",
                "cancelled"
            ],
            default: "pending"
        },

        totalPrice: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// EXPORT BOOKING MODEL
module.exports = mongoose.model("Booking", bookingSchema);