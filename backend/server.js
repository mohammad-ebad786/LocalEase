const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// ==================== ROUTES ====================

const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/test");
const bookingRoutes = require("./routes/bookingRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const providerRoutes = require("./routes/providerRoutes");

// ==================== APP ====================

const app = express();

// ==================== CORS CONFIGURATION ====================

// Add your deployed frontend URL to FRONTEND_URL.
// Multiple origins can be comma-separated.

const allowedOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const developmentOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without an Origin header, such as server-side
            // requests and certain development tools.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            if (
                process.env.NODE_ENV !== "production" &&
                developmentOrigins.includes(origin)
            ) {
                return callback(null, true);
            }

            return callback(null, false);
        }
    })
);

// ==================== MIDDLEWARE ====================

app.use(express.json());

// ==================== REQUEST LOGGER ====================

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// ==================== HOME / HEALTH ROUTES ====================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "LocalEase API is running successfully 🚀"
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "LocalEase API is healthy"
    });
});

// ==================== AUTH ROUTES ====================

app.use("/api/auth", authRoutes);

// ==================== PROTECTED TEST ROUTES ====================

app.use("/api/test", testRoutes);

// ==================== SERVICE ROUTES ====================

app.use("/api/services", serviceRoutes);

// ==================== BOOKING ROUTES ====================

app.use("/api/bookings", bookingRoutes);

// ==================== REVIEW ROUTES ====================

app.use("/api/reviews", reviewRoutes);

// ==================== NOTIFICATION ROUTES ====================

app.use("/api/notifications", notificationRoutes);

// ==================== ADMIN ROUTES ====================

app.use("/api/admin", adminRoutes);

// ==================== PROVIDER ROUTES ====================

app.use("/api/provider", providerRoutes);

// ==================== 404 ROUTE ====================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found",
        path: req.originalUrl
    });
});

// ==================== GLOBAL ERROR HANDLER ====================

app.use((error, req, res, next) => {
    console.error("❌ Global server error:", error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// ==================== SERVER STARTUP ====================

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error(
                "MONGODB_URI environment variable is missing."
            );
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully ✅");

        app.listen(PORT, () => {
            console.log(
                `LocalEase server running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error("❌ LocalEase server startup failed:");
        console.error(error.message);
        process.exit(1);
    }
}

startServer();