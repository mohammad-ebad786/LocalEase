const mongoose = require("mongoose");

const pendingSignupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true, index: true },
        phone: { type: String, required: true, trim: true },
        location: { type: String, trim: true, default: "" },
        password: { type: String, required: true },
        otpHash: { type: String, required: true },
        otpExpiresAt: { type: Date, required: true },
        attempts: { type: Number, default: 0 },
        sendCount: { type: Number, default: 1 },
        sendWindowStartedAt: { type: Date, default: Date.now },
        lastSentAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true, index: { expires: 0 } }
    },
    { timestamps: true }
);

module.exports = mongoose.model("PendingSignup", pendingSignupSchema);
