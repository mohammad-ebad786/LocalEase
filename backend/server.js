const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();


// ==================================================
// ROUTES
// ==================================================

const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/test");
const bookingRoutes = require("./routes/bookingRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const providerRoutes = require("./routes/providerRoutes");


// ==================================================
// APP
// ==================================================

const app = express();


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());

app.use(express.json());


// ==================================================
// BASIC REQUEST LOGGER
// ==================================================

app.use((req, res, next) => {

    console.log(
        `${req.method} ${req.originalUrl}`
    );

    next();
});


// ==================================================
// MONGODB CONNECTION
// ==================================================

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {

        console.log(
            "MongoDB connected successfully ✅"
        );

    })
    .catch((error) => {

        console.error(
            "MongoDB connection failed ❌"
        );

        console.error(
            error.message
        );

    });


// ==================================================
// AUTH ROUTES
// ==================================================

app.use(
    "/api/auth",
    authRoutes
);


// ==================================================
// PROTECTED TEST ROUTES
// ==================================================

app.use(
    "/api/test",
    testRoutes
);


// ==================================================
// SERVICE ROUTES
// ==================================================

app.use(
    "/api/services",
    serviceRoutes
);


// ==================================================
// BOOKING ROUTES
// ==================================================

app.use(
    "/api/bookings",
    bookingRoutes
);


// ==================================================
// REVIEW ROUTES
// ==================================================

app.use(
    "/api/reviews",
    reviewRoutes
);


// ==================================================
// NOTIFICATION ROUTES
// ==================================================

app.use(
    "/api/notifications",
    notificationRoutes
);


// ==================================================
// ADMIN ROUTES
// ==================================================

app.use(
    "/api/admin",
    adminRoutes
);


// ==================================================
// PROVIDER ROUTES
// ==================================================

app.use(
    "/api/provider",
    providerRoutes
);


// ==================================================
// HOME / API TEST ROUTE
// ==================================================

app.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        message: "LocalEase API is running successfully 🚀"
    });

});


// ==================================================
// 404 ROUTE
// ==================================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API route not found",
        path: req.originalUrl
    });

});


// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================

app.use((error, req, res, next) => {

    console.error(
        "❌ Global server error:",
        error
    );

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });

});


// ==================================================
// SERVER
// ==================================================

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {

    console.log(
        `LocalEase server running on http://localhost:${PORT}`
    );

});