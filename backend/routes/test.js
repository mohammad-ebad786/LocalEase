const express = require("express");

// Authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Role-based authorization middleware
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();


// AUTHENTICATED USER ROUTE
// Customer / Provider / Admin
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


// CUSTOMER ONLY ROUTE
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


// PROVIDER ONLY ROUTE
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


// ADMIN ONLY ROUTE
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


// EXPORT ROUTER
module.exports = router;