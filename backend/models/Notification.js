const mongoose = require("mongoose");


// ======================================================
// NOTIFICATION SCHEMA
// ======================================================

const notificationSchema = new mongoose.Schema(
    {
        // ==================================================
        // USER WHO WILL RECEIVE THE NOTIFICATION
        // ==================================================

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        // ==================================================
        // NOTIFICATION TITLE
        // ==================================================

        title: {
            type: String,
            required: true,
            trim: true
        },


        // ==================================================
        // NOTIFICATION MESSAGE
        // ==================================================

        message: {
            type: String,
            required: true,
            trim: true
        },


        // ==================================================
        // NOTIFICATION TYPE
        // ==================================================

        type: {
            type: String,
            enum: [
                "booking",
                "review",
                "system"
            ],
            default: "system"
        },


        // ==================================================
        // READ / UNREAD STATUS
        // ==================================================

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);


// ======================================================
// DATABASE INDEXES
// ======================================================

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


// ======================================================
// EXPORT MODEL
// ======================================================

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);

