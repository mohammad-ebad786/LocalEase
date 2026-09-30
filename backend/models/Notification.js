const mongoose = require("mongoose");

// NOTIFICATION SCHEMA
const notificationSchema = new mongoose.Schema(
    {
        // User who will receive the notification
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Notification title
        title: {
            type: String,
            required: true,
            trim: true
        },

        // Notification message
        message: {
            type: String,
            required: true,
            trim: true
        },

        // Notification type
        type: {
            type: String,
            enum: [
                "booking",
                "review",
                "system"
            ],
            default: "system"
        },

        // Read / unread status
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// DATABASE INDEXES

// Faster user notification listing
notificationSchema.index({
    user: 1,
    createdAt: -1
});

// Faster unread notification queries
notificationSchema.index({
    user: 1,
    isRead: 1
});

// EXPORT MODEL
module.exports = mongoose.model(
    "Notification",
    notificationSchema
);