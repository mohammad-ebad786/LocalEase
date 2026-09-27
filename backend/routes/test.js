const express = require("express");

// JWT Authentication Middleware
const { protect } = require("../middleware/authMiddleware");

// Role-Based Authorization Middleware
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// ==================================================
// ANY AUTHENTICATED USER
// Customer / Provider / Admin
// ==================================================

router.get(
    "/profile",
    protect,
    (req, res) => {

        res.status(200).json({
            success: true,
            message: "Protected route accessed successfully",
            user: req.user
        });

    }
);


// ==================================================
// CUSTOMER ONLY
// ==================================================

router.get(
    "/customer",
    protect,
    authorize("customer"),
    (req, res) => {

        res.status(200).json({
            success: true,
            message: "Customer route accessed successfully",
            user: req.user
        });

    }
);


// ==================================================
// PROVIDER ONLY
// ==================================================

router.get(
    "/provider",
    protect,
    authorize("provider"),
    (req, res) => {

        res.status(200).json({
            success: true,
            message: "Provider route accessed successfully",
            user: req.user
        });

    }
);


// ==================================================
// ADMIN ONLY
// ==================================================

router.get(
    "/admin",
    protect,
    authorize("admin"),
    (req, res) => {

        res.status(200).json({
            success: true,
            message: "Admin route accessed successfully",
            user: req.user
        });

    }
);


// ==================================================
// EXPORT ROUTER
// ==================================================

module.exports = router;