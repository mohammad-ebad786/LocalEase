const express = require("express");

const ProviderApplication = require("../models/ProviderApplication");
const User = require("../models/User");
const { optionalProtect } = require("../middleware/authMiddleware");

const router = express.Router();

// SUBMIT PROVIDER APPLICATION
// POST /api/provider/apply
// Public route
router.post(
    "/apply",
    optionalProtect,
    async (req, res) => {
        try {
            const {
                name,
                phone,
                email,
                location,
                serviceCategory,
                experience,
                price,
                description
            } = req.body;

            // Validate required fields
            if (
                typeof name !== "string" ||
                !name.trim() ||
                typeof phone !== "string" ||
                !phone.trim() ||
                typeof email !== "string" ||
                !email.trim() ||
                typeof location !== "string" ||
                !location.trim() ||
                typeof serviceCategory !== "string" ||
                !serviceCategory.trim() ||
                experience === undefined ||
                price === undefined ||
                typeof description !== "string" ||
                !description.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "All provider application fields are required"
                });
            }

            // Validate experience
            if (
                typeof experience !== "number" ||
                !Number.isFinite(experience) ||
                experience < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Experience must be a valid number"
                });
            }

            // Validate price
            if (
                typeof price !== "number" ||
                !Number.isFinite(price) ||
                price < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Price must be a valid number"
                });
            }

            // Clean email address
            const cleanEmail =
                email.trim().toLowerCase();

            // Get authenticated user, if available
            let authenticatedUser = null;

            if (req.user) {
                authenticatedUser =
                    await User.findById(
                        req.user.userId
                    ).select(
                        "email role isActive"
                    );

                if (!authenticatedUser) {
                    return res.status(401).json({
                        success: false,
                        message:
                            "Account not found. Please log in again."
                    });
                }

                // Check account status
                if (
                    authenticatedUser.isActive === false
                ) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "Your account has been deactivated"
                    });
                }

                // Ensure application email matches account email
                if (
                    authenticatedUser.email
                        .trim()
                        .toLowerCase() !== cleanEmail
                ) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "The application email must match your logged-in account."
                    });
                }

                // Only customer accounts can apply
                if (
                    authenticatedUser.role !== "customer"
                ) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "Only customer accounts can submit a provider application."
                    });
                }
            }

            // Check existing approved application
            const approvedApplication =
                await ProviderApplication.findOne({
                    email: cleanEmail,
                    status: "approved"
                });

            if (approvedApplication) {
                return res.status(409).json({
                    success: false,
                    message:
                        "An approved provider application already exists with this email"
                });
            }

            // Check existing pending application
            const existingApplication =
                await ProviderApplication.findOne({
                    email: cleanEmail,
                    status: "pending"
                });

            if (existingApplication) {

                // Guest applicants cannot submit duplicate applications
                if (!authenticatedUser) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "A provider application with this email is already pending"
                    });
                }

                // Prevent linking an application to another account
                if (
                    existingApplication.user &&
                    existingApplication.user.toString() !==
                        authenticatedUser._id.toString()
                ) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "This application is already linked to another account."
                    });
                }

                // Link an existing guest application to the authenticated account
                if (!existingApplication.user) {
                    existingApplication.user =
                        authenticatedUser._id;

                    await existingApplication.save();

                    return res.status(200).json({
                        success: true,
                        message:
                            "Your existing pending application has been linked to your account.",
                        application: {
                            id: existingApplication._id,
                            name: existingApplication.name,
                            email: existingApplication.email,
                            status: existingApplication.status
                        }
                    });
                }

                return res.status(409).json({
                    success: false,
                    message:
                        "A provider application with this email is already pending"
                });
            }

            // Create application
            const application =
                await ProviderApplication.create({
                    name: name.trim(),

                    phone: phone.trim(),

                    email: cleanEmail,

                    location: location.trim(),

                    serviceCategory:
                        serviceCategory.trim(),

                    experience,

                    price,

                    description:
                        description.trim(),

                    status: "pending",

                    user: authenticatedUser
                        ? authenticatedUser._id
                        : null
                });

            // Success response
            return res.status(201).json({
                success: true,

                message:
                    "Provider application submitted successfully",

                application: {
                    id: application._id,
                    name: application.name,
                    email: application.email,
                    status: application.status
                }
            });
        } catch (error) {
            console.error(
                "Provider application error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// GET APPROVED PROVIDERS
// GET /api/provider/providers
// Protected route
router.get(
    "/providers",
    async (req, res) => {
        try {

            const providers =
                await ProviderApplication.find({
                    status: "approved",
                    user: { $ne: null }
                })
                    .populate(
                        "user",
                        "name email phone location role isActive createdAt"
                    )
                    .sort({
                        createdAt: -1
                    });


            const activeProviders =
                providers.filter(
                    function (provider) {

                        return (
                            provider.user &&
                            provider.user.isActive !== false &&
                            provider.user.role === "provider"
                        );

                    }
                );


            const providerList =
                activeProviders.map(
                    function (provider) {

                        return {

                            id:
                                provider.user._id,

                            name:
                                provider.user.name ||
                                provider.name,

                            email:
                                provider.user.email ||
                                provider.email,

                            phone:
                                provider.user.phone ||
                                provider.phone,

                            location:
                                provider.location ||
                                provider.user.location ||
                                "Not provided",

                            serviceCategory:
                                provider.serviceCategory ||
                                "Service Provider",

                            experience:
                                provider.experience,

                            price:
                                provider.price,

                            description:
                                provider.description ||
                                "Professional local service provider.",

                            photo:
                                provider.photo ||
                                "",

                            memberSince:
                                provider.user.createdAt ||
                                provider.createdAt
                        };

                    }
                );


            res.status(200).json({
                success: true,

                count:
                    providerList.length,

                providers:
                    providerList
            });

        } catch (error) {

            console.error(
                "Get providers error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// EXPORT ROUTER
module.exports = router;