const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Review = require("../models/Review");
const ProviderApplication = require("../models/ProviderApplication");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ADMIN DASHBOARD
// GET /api/admin/dashboard
router.get(
    "/dashboard",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const totalUsers =
                await User.countDocuments();

            const totalServices =
                await Service.countDocuments({
                    isActive: true
                });

            const totalBookings =
                await Booking.countDocuments();

            const totalReviews =
                await Review.countDocuments();

            res.status(200).json({
                success: true,

                stats: {
                    users: totalUsers,
                    services: totalServices,
                    bookings: totalBookings,
                    reviews: totalReviews
                }
            });
        } catch (error) {
            console.error(
                "Admin dashboard error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// GET ALL USERS
// GET /api/admin/users
router.get(
    "/users",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const users =
                await User.find()
                    .select("-password")
                    .sort({
                        createdAt: -1
                    });

            res.status(200).json({
                success: true,
                count: users.length,
                users
            });
        } catch (error) {
            console.error(
                "Get admin users error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// GET SINGLE USER
// GET /api/admin/users/:id
router.get(
    "/users/:id",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const {
                id
            } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID"
                });
            }

            const user =
                await User.findById(id)
                    .select("-password");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            res.status(200).json({
                success: true,
                user
            });
        } catch (error) {
            console.error(
                "Get single admin user error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// ACTIVATE / DEACTIVATE USER
// PUT /api/admin/users/:id/status
router.put(
    "/users/:id/status",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const {
                id
            } = req.params;

            const {
                isActive
            } = req.body;

            if (
                !mongoose.Types.ObjectId.isValid(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID"
                });
            }

            if (
                typeof isActive !== "boolean"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "isActive must be true or false"
                });
            }

            const user =
                await User.findById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            user.isActive =
                isActive;

            await user.save();

            res.status(200).json({
                success: true,

                message:
                    isActive
                        ? "User activated successfully"
                        : "User deactivated successfully",

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive
                }
            });
        } catch (error) {
            console.error(
                "Update user status error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// GET ALL BOOKINGS
// GET /api/admin/bookings
router.get(
    "/bookings",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const bookings =
                await Booking.find()
                    .populate(
                        "customer",
                        "name email phone"
                    )
                    .populate(
                        "service",
                        "name price category"
                    )
                    .populate(
                        "provider",
                        "name email phone"
                    )
                    .sort({
                        createdAt: -1
                    });

            res.status(200).json({
                success: true,
                count: bookings.length,
                bookings
            });
        } catch (error) {
            console.error(
                "Get admin bookings error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// GET SINGLE BOOKING
// GET /api/admin/bookings/:id
router.get(
    "/bookings/:id",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const {
                id
            } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid booking ID"
                });
            }

            const booking =
                await Booking.findById(id)
                    .populate(
                        "customer",
                        "name email phone"
                    )
                    .populate(
                        "service",
                        "name price category"
                    )
                    .populate(
                        "provider",
                        "name email phone"
                    );

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }

            res.status(200).json({
                success: true,
                booking
            });
        } catch (error) {
            console.error(
                "Get single admin booking error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// GET ALL REVIEWS
// GET /api/admin/reviews
router.get(
    "/reviews",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const reviews =
                await Review.find()
                    .populate(
                        "customer",
                        "name email"
                    )
                    .populate(
                        "service",
                        "name category"
                    )
                    .populate({
                        path: "booking",
                        select:
                            "bookingDate status totalPrice provider",
                        populate: {
                            path: "provider",
                            select:
                                "name email phone"
                        }
                    })
                    .sort({
                        createdAt: -1
                    });

            res.status(200).json({
                success: true,
                count: reviews.length,
                reviews
            });
        } catch (error) {
            console.error(
                "Get admin reviews error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// GET ALL SERVICES
// GET /api/admin/services
router.get(
    "/services",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const services =
                await Service.find()
                    .sort({
                        createdAt: -1
                    });

            res.status(200).json({
                success: true,
                count: services.length,
                services
            });
        } catch (error) {
            console.error(
                "Get admin services error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// CREATE SERVICE
// POST /api/admin/services
router.post(
    "/services",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const {
                name,
                description,
                category,
                price,
                image
            } = req.body;

            if (
                !name ||
                !description ||
                !category ||
                price === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Name, description, category and price are required"
                });
            }

            const numericPrice =
                Number(price);

            if (
                Number.isNaN(numericPrice) ||
                numericPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Price must be a valid non-negative number"
                });
            }

            const service =
                await Service.create({
                    name: name.trim(),
                    description: description.trim(),
                    category: category.trim(),
                    price: numericPrice,
                    image:
                        image
                            ? image.trim()
                            : "",
                    isActive: true
                });

            res.status(201).json({
                success: true,
                message:
                    "Service created successfully",
                service
            });
        } catch (error) {
            console.error(
                "Create admin service error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// UPDATE SERVICE
// PUT /api/admin/services/:id
router.put(
    "/services/:id",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const {
                id
            } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid service ID"
                });
            }

            const {
                name,
                description,
                category,
                price,
                image,
                isActive
            } = req.body;

            const service =
                await Service.findById(id);

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found"
                });
            }

            if (name !== undefined) {
                service.name =
                    name.trim();
            }

            if (description !== undefined) {
                service.description =
                    description.trim();
            }

            if (category !== undefined) {
                service.category =
                    category.trim();
            }

            if (price !== undefined) {
                const numericPrice =
                    Number(price);

                if (
                    Number.isNaN(numericPrice) ||
                    numericPrice < 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Price must be a valid non-negative number"
                    });
                }

                service.price =
                    numericPrice;
            }

            if (image !== undefined) {
                service.image =
                    image.trim();
            }

            if (
                isActive !== undefined
            ) {
                if (
                    typeof isActive !== "boolean"
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "isActive must be true or false"
                    });
                }

                service.isActive =
                    isActive;
            }

            await service.save();

            res.status(200).json({
                success: true,
                message:
                    "Service updated successfully",
                service
            });
        } catch (error) {
            console.error(
                "Update admin service error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// DELETE SERVICE
// DELETE /api/admin/services/:id
router.delete(
    "/services/:id",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const {
                id
            } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid service ID"
                });
            }

            const service =
                await Service.findById(id);

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found"
                });
            }

            await Service.findByIdAndDelete(id);

            res.status(200).json({
                success: true,
                message:
                    "Service deleted successfully"
            });
        } catch (error) {
            console.error(
                "Delete admin service error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// PROVIDER APPLICATIONS

// GET ALL PROVIDER APPLICATIONS
// GET /api/admin/provider-applications
router.get(
    "/provider-applications",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const applications =
                await ProviderApplication.find()
                    .populate(
                        "user",
                        "name email phone role isActive"
                    )
                    .sort({
                        createdAt: -1
                    });

            res.status(200).json({
                success: true,
                count: applications.length,
                applications
            });
        } catch (error) {
            console.error(
                "Get provider applications error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// GET SINGLE PROVIDER APPLICATION
// GET /api/admin/provider-applications/:id
router.get(
    "/provider-applications/:id",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const {
                id
            } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid provider application ID"
                });
            }

            const application =
                await ProviderApplication.findById(id)
                    .populate(
                        "user",
                        "name email phone role isActive"
                    );

            if (!application) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Provider application not found"
                });
            }

            res.status(200).json({
                success: true,
                application
            });
        } catch (error) {
            console.error(
                "Get single provider application error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// APPROVE PROVIDER APPLICATION
// PUT /api/admin/provider-applications/:id/approve
router.put(
    "/provider-applications/:id/approve",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const {
                id
            } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid provider application ID"
                });
            }

            const application =
                await ProviderApplication.findById(id);

            if (!application) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Provider application not found"
                });
            }

            if (
                application.status === "approved"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Provider application is already approved"
                });
            }

            if (
                application.status === "rejected"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Rejected application cannot be approved"
                });
            }

            application.status =
                "approved";

            await application.save();

            res.status(200).json({
                success: true,

                message:
                    "Provider application approved successfully",

                application
            });
        } catch (error) {
            console.error(
                "Approve provider application error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

// REJECT PROVIDER APPLICATION
// PUT /api/admin/provider-applications/:id/reject
router.put(
    "/provider-applications/:id/reject",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const {
                id
            } = req.params;

            if (
                !mongoose.Types.ObjectId.isValid(id)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid provider application ID"
                });
            }

            const application =
                await ProviderApplication.findById(id);

            if (!application) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Provider application not found"
                });
            }

            if (
                application.status === "rejected"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Provider application is already rejected"
                });
            }

            if (
                application.status === "approved"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Approved application cannot be rejected"
                });
            }

            application.status =
                "rejected";

            await application.save();

            res.status(200).json({
                success: true,

                message:
                    "Provider application rejected successfully",

                application
            });
        } catch (error) {
            console.error(
                "Reject provider application error:",
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