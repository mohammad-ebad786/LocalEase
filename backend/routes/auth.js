const express = require("express");
const User = require("../models/User");
const ProviderApplication = require("../models/ProviderApplication");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const PendingSignup = require("../models/PendingSignup");
const PendingPasswordReset = require("../models/PendingPasswordReset");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// ==================== PASSWORD POLICY ====================
const PASSWORD_POLICY_MESSAGE = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";

function isStrongPassword(password) {
    return typeof password === "string" &&
        password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9\s]/.test(password);
}



// ==================== SIGNUP OTP HELPERS ====================

function normalizeIndianPhone(value) {
    const digits = String(value || "").replace(/[\s()-]/g, "");
    if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
    if (/^\+91[6-9]\d{9}$/.test(digits)) return digits;
    return null;
}

async function sendTextBeeSms(phone, message) {
    const apiKey = process.env.TEXTBEE_API_KEY;
    if (!apiKey) {
        const error = new Error("SMS service is not configured. Please contact the administrator.");
        error.status = 503;
        throw error;
    }

    const baseUrl = (process.env.TEXTBEE_BASE_URL || "https://api.textbee.dev/api/v1").replace(/\/$/, "");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${baseUrl}/gateway/send-sms`, {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ recipients: [phone], message }),
            signal: controller.signal
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            console.error("TextBee request failed with status:", response.status);
            const error = new Error(
                response.status === 401
                    ? "SMS service authentication failed. Please contact the administrator."
                    : response.status === 429
                        ? "SMS limit reached. Please try again later."
                        : "Unable to send OTP right now. Please try again later."
            );
            error.status = response.status === 429 ? 429 : 502;
            throw error;
        }

        return result;
    } finally {
        clearTimeout(timeout);
    }
}

// ==================== SEND SIGNUP OTP ====================
// POST /api/auth/signup/send-otp

router.post("/signup/send-otp", async (req, res) => {
    try {
        const { name, email, phone, location, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: "All required fields must be filled." });
        }
        if (!isStrongPassword(String(password))) {
            return res.status(400).json({ success: false, message: PASSWORD_POLICY_MESSAGE });
        }

        const cleanName = String(name).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPhone = normalizeIndianPhone(phone);
        const cleanLocation = String(location || "").trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        }
        if (!cleanPhone) {
            return res.status(400).json({ success: false, message: "Enter a valid 10-digit Indian mobile number, optionally with +91." });
        }

        const existingUser = await User.findOne({ email: cleanEmail }).select("_id");
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email already registered. Please login." });
        }

        const now = new Date();
        let pending = await PendingSignup.findOne({ email: cleanEmail });

        if (pending && pending.lastSentAt && now - pending.lastSentAt < 60 * 1000) {
            return res.status(429).json({ success: false, message: "Please wait 60 seconds before requesting another OTP." });
        }

        if (pending && pending.sendWindowStartedAt && now - pending.sendWindowStartedAt > 30 * 60 * 1000) {
            pending.sendCount = 0;
            pending.sendWindowStartedAt = now;
        }
        if (pending && pending.sendCount >= 5) {
            return res.status(429).json({ success: false, message: "OTP request limit reached. Please try again after 30 minutes." });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const passwordHash = await bcrypt.hash(String(password), 10);

        if (!pending) {
            pending = new PendingSignup({
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone,
                location: cleanLocation,
                password: passwordHash,
                otpHash,
                otpExpiresAt: new Date(now.getTime() + 5 * 60 * 1000),
                attempts: 0,
                sendCount: 1,
                sendWindowStartedAt: now,
                lastSentAt: now,
                expiresAt: new Date(now.getTime() + 30 * 60 * 1000)
            });
        } else {
            pending.name = cleanName;
            pending.phone = cleanPhone;
            pending.location = cleanLocation;
            pending.password = passwordHash;
            pending.otpHash = otpHash;
            pending.otpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
            pending.attempts = 0;
            pending.sendCount += 1;
            pending.lastSentAt = now;
            pending.expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
        }

        await pending.save();

        try {
            const smsResult = await sendTextBeeSms(
                cleanPhone,
                `Your LocalEase verification code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`
            );

            return res.status(200).json({
                success: true,
                message: "OTP request accepted. Please check your phone.",
                expiresIn: 300,
                smsBatchId: smsResult?.data?.smsBatchId || null
            });
        } catch (smsError) {
            pending.otpHash = "invalidated";
            pending.otpExpiresAt = new Date(0);
            await pending.save().catch(() => {});
            throw smsError;
        }
    } catch (error) {
        console.error("Signup OTP send error:", error.message);
        return res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : "Unable to start phone verification. Please try again."
        });
    }
});

// ==================== VERIFY SIGNUP OTP ====================
// POST /api/auth/signup/verify-otp

router.post("/signup/verify-otp", async (req, res) => {
    try {
        const { email, phone, otp } = req.body;
        if (!email || !phone || !otp) {
            return res.status(400).json({ success: false, message: "Email, phone number and OTP are required." });
        }
        if (!/^\d{6}$/.test(String(otp))) {
            return res.status(400).json({ success: false, message: "Enter the 6-digit OTP." });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPhone = normalizeIndianPhone(phone);
        if (!cleanPhone) {
            return res.status(400).json({ success: false, message: "Invalid phone number." });
        }

        const pending = await PendingSignup.findOne({ email: cleanEmail, phone: cleanPhone });
        if (!pending) {
            return res.status(404).json({ success: false, message: "Verification request not found. Please request a new OTP." });
        }
        if (pending.expiresAt <= new Date() || pending.otpExpiresAt <= new Date()) {
            return res.status(410).json({ success: false, message: "OTP expired. Please request a new one." });
        }
        if (pending.attempts >= 5) {
            return res.status(429).json({ success: false, message: "Too many incorrect attempts. Please request a new OTP." });
        }

        const validOtp = await bcrypt.compare(String(otp), pending.otpHash);
        if (!validOtp) {
            pending.attempts += 1;
            await pending.save();
            const remaining = Math.max(0, 5 - pending.attempts);
            return res.status(400).json({
                success: false,
                message: remaining
                    ? `Incorrect OTP. ${remaining} attempts remaining.`
                    : "Too many incorrect attempts. Please request a new OTP."
            });
        }

        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            await PendingSignup.deleteOne({ _id: pending._id });
            return res.status(409).json({ success: false, message: "Email already registered. Please login." });
        }

        const providerApplication = await ProviderApplication.findOne({
            email: cleanEmail,
            status: "approved"
        });
        const userRole = providerApplication ? "provider" : "customer";

        const user = await User.create({
            name: pending.name,
            email: pending.email,
            phone: pending.phone,
            location: pending.location,
            password: pending.password,
            role: userRole,
            isActive: true
        });

        if (providerApplication) {
            providerApplication.user = user._id;
            await providerApplication.save();
        }

        await PendingSignup.deleteOne({ _id: pending._id });

        return res.status(201).json({
            success: true,
            message: providerApplication
                ? "Phone verified and provider account created successfully."
                : "Phone verified and account created successfully.",
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
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "This email is already registered. Please login." });
        }
        console.error("Signup OTP verification error:", error.message);
        return res.status(500).json({ success: false, message: "Unable to verify OTP right now. Please try again." });
    }
});


// ==================== SIGNUP API ====================
// POST /api/auth/signup
// Disabled: all new accounts must complete phone OTP verification.

router.post("/signup", (req, res) => {
    return res.status(403).json({
        success: false,
        message: "Phone verification is required. Please use the signup OTP process."
    });
});


// ==================== LOGIN API ====================
// POST /api/auth/login

router.post("/login", async (req, res) => {

    console.log("🔥 JWT LOGIN ROUTE HIT");

    try {

        const {
            email,
            password
        } = req.body;


        // ==================== REQUIRED FIELDS ====================

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }


        // ==================== FIND USER ====================

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });


        // ==================== USER NOT FOUND ====================

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password"
            });
        }


        // ==================== CHECK ACCOUNT STATUS ====================

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message:
                    "Your account has been deactivated. Please contact the administrator."
            });
        }


        // ==================== COMPARE PASSWORD ====================

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


        // ==================== GENERATE JWT ====================

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


        // ==================== LOGIN SUCCESS ====================

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


// ==================== PASSWORD RESET OTP ====================
// POST /api/auth/password-reset/send-otp

router.post("/password-reset/send-otp", async (req, res) => {
    try {
        const cleanEmail = String(req.body.email || "").trim().toLowerCase();
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        }

        const genericResponse = {
            success: true,
            message: "If an account exists with this email, a verification code has been sent to its registered phone number."
        };
        const user = await User.findOne({ email: cleanEmail, isActive: { $ne: false } });
        if (!user) return res.status(200).json(genericResponse);

        const phone = normalizeIndianPhone(user.phone);
        if (!phone) return res.status(200).json(genericResponse);

        const now = new Date();
        let pending = await PendingPasswordReset.findOne({ email: cleanEmail });
        if (pending && now - pending.lastSentAt < 60 * 1000) {
            return res.status(429).json({ success: false, message: "Please wait 60 seconds before requesting another OTP." });
        }
        if (pending && now - pending.sendWindowStartedAt >= 30 * 60 * 1000) {
            pending.sendCount = 0;
            pending.sendWindowStartedAt = now;
        }
        if (pending && pending.sendCount >= 5) {
            return res.status(429).json({ success: false, message: "OTP request limit reached. Please try again after 30 minutes." });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        if (!pending) {
            pending = new PendingPasswordReset({
                email: cleanEmail,
                userId: user._id,
                otpHash,
                otpExpiresAt: new Date(now.getTime() + 5 * 60 * 1000),
                expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
                attempts: 0,
                sendCount: 1,
                sendWindowStartedAt: now,
                lastSentAt: now
            });
        } else {
            pending.userId = user._id;
            pending.otpHash = otpHash;
            pending.otpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
            pending.expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
            pending.attempts = 0;
            pending.sendCount += 1;
            pending.lastSentAt = now;
        }
        await pending.save();

        try {
            await sendTextBeeSms(phone, `Your LocalEase password reset code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`);
        } catch (smsError) {
            pending.otpHash = "invalidated";
            pending.otpExpiresAt = new Date(0);
            await pending.save().catch(() => {});
            throw smsError;
        }

        return res.status(200).json(genericResponse);
    } catch (error) {
        console.error("Password reset OTP send error:", error.message);
        return res.status(error.status || 500).json({
            success: false,
            message: error.status ? error.message : "Unable to send password reset OTP. Please try again."
        });
    }
});


// ==================== VERIFY OTP AND RESET PASSWORD ====================
// POST /api/auth/password-reset/verify-otp

router.post("/password-reset/verify-otp", async (req, res) => {
    try {
        const cleanEmail = String(req.body.email || "").trim().toLowerCase();
        const otp = String(req.body.otp || "").trim();
        const newPassword = String(req.body.newPassword || "");

        if (!cleanEmail || !/^\d{6}$/.test(otp) || !newPassword) {
            return res.status(400).json({ success: false, message: "Email, 6-digit OTP and new password are required." });
        }
        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ success: false, message: PASSWORD_POLICY_MESSAGE });
        }

        const pending = await PendingPasswordReset.findOne({ email: cleanEmail });
        if (!pending) {
            return res.status(400).json({ success: false, message: "OTP request expired. Please request a new OTP." });
        }
        if (pending.expiresAt <= new Date() || pending.otpExpiresAt <= new Date()) {
            await PendingPasswordReset.deleteOne({ _id: pending._id });
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
        }
        if (pending.attempts >= 5) {
            await PendingPasswordReset.deleteOne({ _id: pending._id });
            return res.status(429).json({ success: false, message: "Too many incorrect attempts. Please request a new OTP." });
        }

        const validOtp = await bcrypt.compare(otp, pending.otpHash);
        if (!validOtp) {
            pending.attempts += 1;
            await pending.save();
            return res.status(400).json({
                success: false,
                message: pending.attempts >= 5
                    ? "Too many incorrect attempts. Please request a new OTP."
                    : `Incorrect OTP. ${5 - pending.attempts} attempt(s) remaining.`
            });
        }

        const user = await User.findOne({ _id: pending.userId, email: cleanEmail, isActive: { $ne: false } });
        if (!user) {
            await PendingPasswordReset.deleteOne({ _id: pending._id });
            return res.status(400).json({ success: false, message: "Password reset could not be completed. Please request a new OTP." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        await PendingPasswordReset.deleteOne({ _id: pending._id });

        return res.status(200).json({ success: true, message: "Password reset successfully. Please log in with your new password." });
    } catch (error) {
        console.error("Password reset verification error:", error);
        return res.status(500).json({ success: false, message: "Unable to reset password right now. Please try again." });
    }
});


// ==================== LEGACY RESET PASSWORD API ====================
// PUT /api/auth/reset-password
// Disabled: password reset must be completed through phone OTP verification.

router.put("/reset-password", (req, res) => {
    return res.status(403).json({
        success: false,
        message: "Phone verification is required. Please use the password reset OTP process."
    });
});


// ==================== GET MY PROFILE ====================
// GET /api/auth/me

router.get(
    "/me",
    protect,
    async (req, res) => {

        try {

            // ==================== FIND LOGGED-IN USER ====================

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


            // ==================== CHECK ACCOUNT STATUS ====================

            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Your account has been deactivated"
                });
            }


            // ==================== PROVIDER PROFILE DATA ====================

            let providerProfile = null;

            if (user.role === "provider") {

                const providerApplication =
                    await ProviderApplication.findOne({
                        user: user._id,
                        status: "approved"
                    }).select(
                        "serviceCategory experience price description location photo"
                    );

                if (providerApplication) {

                    providerProfile = {
                        serviceCategory:
                            providerApplication.serviceCategory,

                        experience:
                            providerApplication.experience,

                        price:
                            providerApplication.price,

                        description:
                            providerApplication.description,

                        location:
                            providerApplication.location ||
                            user.location,

                        photo:
                            providerApplication.photo ||
                            ""
                    };

                }

            }


            // ==================== RESPONSE ====================

            res.status(200).json({
                success: true,

                user: {
                    ...user.toObject(),

                    providerProfile
                }
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


// ==================== UPDATE MY PROFILE ====================
// PUT /api/auth/me

router.put(
    "/me",
    protect,
    async (req, res) => {

        try {

            const {
                name,
                phone,
                photo
            } = req.body;


            // ==================== REQUIRED FIELDS ====================

            if (!name || !phone) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Name and phone are required"
                });
            }


            // ==================== FIND USER ====================

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


            // ==================== CHECK ACCOUNT STATUS ====================

            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Your account has been deactivated"
                });
            }


            // ==================== UPDATE ALLOWED FIELDS ====================

            user.name =
                name.trim();

            user.phone =
                phone.trim();


            await user.save();


            // ==================== PROVIDER PROFILE DATA ====================

            let providerProfile = null;

            if (user.role === "provider") {

                const providerApplication =
                    await ProviderApplication.findOne({
                        user: user._id,
                        status: "approved"
                    });

                if (providerApplication) {

                    // ==================== UPDATE PROVIDER PHOTO ====================

                    if (
                        typeof photo === "string"
                    ) {

                        providerApplication.photo =
                            photo.trim();

                        await providerApplication.save();

                    }


                    providerProfile = {
                        serviceCategory:
                            providerApplication.serviceCategory,

                        experience:
                            providerApplication.experience,

                        price:
                            providerApplication.price,

                        description:
                            providerApplication.description,

                        location:
                            providerApplication.location ||
                            user.location,

                        photo:
                            providerApplication.photo ||
                            ""
                    };

                }

            }


            // ==================== RESPONSE ====================

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
                    createdAt: user.createdAt,

                    providerProfile
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


// ==================== CHANGE PASSWORD ====================
// PUT /api/auth/change-password

router.put(
    "/change-password",
    protect,
    async (req, res) => {

        try {

            const {
                currentPassword,
                newPassword
            } = req.body;


            // ==================== REQUIRED FIELDS ====================

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


            // ==================== PASSWORD VALIDATION ====================

            if (!isStrongPassword(newPassword)) {
                return res.status(400).json({
                    success: false,
                    message: PASSWORD_POLICY_MESSAGE
                });
            }


            // ==================== FIND USER ====================

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


            // ==================== CHECK ACCOUNT STATUS ====================

            if (user.isActive === false) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Your account has been deactivated"
                });
            }


            // ==================== VERIFY CURRENT PASSWORD ====================

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


            // ==================== PREVENT SAME PASSWORD ====================

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


            // ==================== HASH NEW PASSWORD ====================

            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    10
                );


            user.password =
                hashedPassword;

            await user.save();


            // ==================== SUCCESS ====================

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


// ==================== JWT PROTECTED TEST ROUTE ====================
// GET /api/auth/test-protected

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


// ==================== CUSTOMER ONLY TEST ROUTE ====================
// GET /api/auth/test-customer

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


// ==================== PROVIDER ONLY TEST ROUTE ====================
// GET /api/auth/test-provider

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


// ==================== ADMIN ONLY TEST ROUTE ====================
// GET /api/auth/test-admin

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


// ==================== EXPORT ROUTER ====================

module.exports = router;