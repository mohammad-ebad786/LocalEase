const express = require("express");
const User = require("../models/User");
const ProviderApplication = require("../models/ProviderApplication");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();


// ==================================================
// SIGNUP API
// POST /api/auth/signup
// ==================================================
//
// Normal signup creates CUSTOMER.
//
// If the email belongs to an APPROVED provider
// application, the account is created as PROVIDER.
//
// Client cannot directly choose role.
// ==================================================

router.post("/signup", async (req, res) => {
    try {

        const {
            name,
            email,
            phone,
            location,
            password
        } = req.body;


        // ==============================================
        // REQUIRED FIELDS
        // ==============================================

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }


        // ==============================================
        // PASSWORD VALIDATION
        // ==============================================

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters"
            });
        }


        // ==============================================
        // CLEAN INPUT
        // ==============================================

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.trim();


        // ==============================================
        // CHECK EXISTING EMAIL
        // ==============================================

        const existingUser = await User.findOne({
            email: cleanEmail
        });


        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }


        // ==============================================
        // CHECK PROVIDER APPLICATION
        // ==============================================

        const providerApplication =
            await ProviderApplication.findOne({
                email: cleanEmail,
                status: "approved"
            });


        // ==============================================
        // DETERMINE USER ROLE
        // ==============================================
        //
        // Approved application:
        //     provider
        //
        // No approved application:
        //     customer
        //
        // Role is NEVER accepted from client.
        // ==============================================

        const userRole =
            providerApplication
                ? "provider"
                : "customer";


        // ==============================================
        // HASH PASSWORD
        // ==============================================

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // ==============================================
        // CREATE USER
        // ==============================================

        const user = await User.create({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            location: location ? location.trim() : "",
            password: hashedPassword,
            role: userRole,
            isActive: true
        });


        // ==============================================
        // LINK PROVIDER APPLICATION
        // ==============================================
        //
        // If this account was created from an approved
        // provider application, store the User ID in
        // that application.
        // ==============================================

        if (providerApplication) {

            providerApplication.user =
                user._id;

            await providerApplication.save();

        }


        // ==============================================
        // SUCCESS RESPONSE
        // ==============================================

        res.status(201).json({
            success: true,

            message:
                providerApplication
                    ? "Provider account created successfully"
                    : "User registered successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                location: user.location,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {

        console.error(
            "Signup error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


// ==================================================
// LOGIN API
// POST /api/auth/login
// ==================================================

router.post("/login", async (req, res) => {

    console.log("🔥 JWT LOGIN ROUTE HIT");

    try {

        const {
            email,
            password
        } = req.body;


        // ==============================================
        // REQUIRED FIELDS
        // ==============================================

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }


        // ==============================================
        // FIND USER
        // ==============================================

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });


        // ==============================================
        // USER NOT FOUND
        // ==============================================

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }


        // ==============================================
        // CHECK ACCOUNT STATUS
        // ==============================================

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message:
                    "Your account has been deactivated. Please contact the administrator."
            });
        }


        // ==============================================
        // COMPARE PASSWORD
        // ==============================================

        const isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }


        // ==============================================
        // GENERATE JWT
        // ==============================================

        const token = jwt.sign(
            {
                userId:
                    user._id.toString(),

                role:
                    user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }
        );


        console.log(
            "🔥 JWT TOKEN GENERATED:",
            !!token
        );


        // ==============================================
        // LOGIN SUCCESS
        // ==============================================

        res.status(200).json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


// ==================================================
// RESET PASSWORD API
// PUT /api/auth/reset-password
// ==================================================
//
// NOTE:
// This is currently a direct email-based reset.
// Later we can make this more secure with
// OTP/email verification.
// ==================================================

router.put("/reset-password", async (req, res) => {

    try {

        const {
            email,
            newPassword
        } = req.body;


        // ==============================================
        // REQUIRED FIELDS
        // ==============================================

        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and new password are required"
            });
        }


        // ==============================================
        // PASSWORD VALIDATION
        // ==============================================

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 6 characters"
            });
        }


        // ==============================================
        // FIND USER
        // ==============================================

        const user = await User.findOne({
            email:
                email.trim().toLowerCase()
        });


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // ==============================================
        // HASH NEW PASSWORD
        // ==============================================

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        user.password =
            hashedPassword;

        await user.save();


        // ==============================================
        // SUCCESS
        // ==============================================

        res.status(200).json({
            success: true,
            message:
                "Password reset successfully"
        });

    } catch (error) {

        console.error(
            "Reset password error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


// ==================================================
// GET MY PROFILE
// GET /api/auth/me
// ==================================================

router.get(
    "/me",
    protect,
    async (req, res) => {

        try {

            // ==============================================
            // FIND LOGGED-IN USER
            // ==============================================

            const user =
                await User.findById(
                    req.user.userId
                ).select("-password");


            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }


            // ==============================================
            // CHECK ACCOUNT STATUS
            // ==============================================

            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Your account has been deactivated"
                });
            }


            // ==============================================
            // RESPONSE
            // ==============================================

            res.status(200).json({
                success: true,
                user
            });

        } catch (error) {

            console.error(
                "Get my profile error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ==================================================
// UPDATE MY PROFILE
// PUT /api/auth/me
// ==================================================

router.put(
    "/me",
    protect,
    async (req, res) => {

        try {

            const {
                name,
                phone
            } = req.body;


            // ==============================================
            // REQUIRED FIELDS
            // ==============================================

            if (!name || !phone) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Name and phone are required"
                });
            }


            // ==============================================
            // FIND USER
            // ==============================================

            const user =
                await User.findById(
                    req.user.userId
                );


            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }


            // ==============================================
            // CHECK ACCOUNT STATUS
            // ==============================================

            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Your account has been deactivated"
                });
            }


            // ==============================================
            // UPDATE ALLOWED FIELDS ONLY
            // ==============================================

            user.name =
                name.trim();

            user.phone =
                phone.trim();


            await user.save();


            // ==============================================
            // RESPONSE
            // ==============================================

            res.status(200).json({
                success: true,
                message:
                    "Profile updated successfully",

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    location: user.location,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                }
            });

        } catch (error) {

            console.error(
                "Update my profile error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ==================================================
// CHANGE PASSWORD
// PUT /api/auth/change-password
// ==================================================

router.put(
    "/change-password",
    protect,
    async (req, res) => {

        try {

            const {
                currentPassword,
                newPassword
            } = req.body;


            // ==============================================
            // REQUIRED FIELDS
            // ==============================================

            if (
                !currentPassword ||
                !newPassword
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Current password and new password are required"
                });
            }


            // ==============================================
            // PASSWORD VALIDATION
            // ==============================================

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message:
                        "New password must be at least 6 characters"
                });
            }


            // ==============================================
            // FIND USER
            // ==============================================

            const user =
                await User.findById(
                    req.user.userId
                );


            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }


            // ==============================================
            // CHECK ACCOUNT STATUS
            // ==============================================

            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Your account has been deactivated"
                });
            }


            // ==============================================
            // VERIFY CURRENT PASSWORD
            // ==============================================

            const isPasswordCorrect =
                await bcrypt.compare(
                    currentPassword,
                    user.password
                );


            if (!isPasswordCorrect) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Current password is incorrect"
                });
            }


            // ==============================================
            // PREVENT SAME PASSWORD
            // ==============================================

            const isSamePassword =
                await bcrypt.compare(
                    newPassword,
                    user.password
                );


            if (isSamePassword) {
                return res.status(400).json({
                    success: false,
                    message:
                        "New password must be different from current password"
                });
            }


            // ==============================================
            // HASH NEW PASSWORD
            // ==============================================

            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    10
                );


            user.password =
                hashedPassword;

            await user.save();


            // ==============================================
            // SUCCESS
            // ==============================================

            res.status(200).json({
                success: true,
                message:
                    "Password changed successfully"
            });

        } catch (error) {

            console.error(
                "Change password error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ==================================================
// JWT PROTECTED TEST ROUTE
// GET /api/auth/test-protected
// ==================================================

router.get(
    "/test-protected",
    protect,
    (req, res) => {

        res.status(200).json({
            success: true,
            message:
                "Protected route accessed successfully",
            user: req.user
        });
    }
);


// ==================================================
// CUSTOMER ONLY TEST ROUTE
// GET /api/auth/test-customer
// ==================================================

router.get(
    "/test-customer",
    protect,
    authorize("customer"),
    (req, res) => {

        res.status(200).json({
            success: true,
            message:
                "Customer-only route accessed successfully",
            user: req.user
        });
    }
);


// ==================================================
// PROVIDER ONLY TEST ROUTE
// GET /api/auth/test-provider
// ==================================================

router.get(
    "/test-provider",
    protect,
    authorize("provider"),
    (req, res) => {

        res.status(200).json({
            success: true,
            message:
                "Provider-only route accessed successfully",
            user: req.user
        });
    }
);


// ==================================================
// ADMIN ONLY TEST ROUTE
// GET /api/auth/test-admin
// ==================================================

router.get(
    "/test-admin",
    protect,
    authorize("admin"),
    (req, res) => {

        res.status(200).json({
            success: true,
            message:
                "Admin-only route accessed successfully",
            user: req.user
        });
    }
);


// ==================================================
// EXPORT ROUTER
// ==================================================

module.exports = router;