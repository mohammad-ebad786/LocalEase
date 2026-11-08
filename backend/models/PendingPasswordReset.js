const mongoose = require("mongoose");

const pendingPasswordResetSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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

module.exports = mongoose.model("PendingPasswordReset", pendingPasswordResetSchema);
