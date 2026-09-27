const express = require("express");
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Notification = require("../models/Notification");

const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// CREATE BOOKING
// ============================================================

router.post(
    "/",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {
        try {
            const {
                service,
                bookingDate,
                address,
                phone,
                notes
            } = req.body;

            if (!service || !bookingDate || !address || !phone) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Service, booking date, address and phone are required"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(service)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid service ID"
                });
            }

            const serviceData = await Service.findOne({
                _id: service,
                isActive: true
            });

            if (!serviceData) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found or inactive"
                });
            }

            const booking = await Booking.create({
                customer: req.user.userId,
                service: serviceData._id,
                bookingDate,
                address,
                phone,
                notes: notes || "",
                totalPrice: serviceData.price,
                status: "pending"
            });

            res.status(201).json({
                success: true,
                message: "Booking created successfully",
                booking
            });

        } catch (error) {
            console.error("Create booking error:", error);

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ============================================================
// CUSTOMER - MY BOOKINGS
// ============================================================

router.get(
    "/my-bookings",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {
        try {
            const bookings = await Booking.find({
                customer: req.user.userId
            })
                .populate("service", "name category price image")
                .populate("provider", "name email phone")
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: bookings.length,
                bookings
            });

        } catch (error) {
            console.error("Get customer bookings error:", error);

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ============================================================
// PROVIDER - MY BOOKINGS
// ============================================================

router.get(
    "/provider/my-bookings",
    protect,
    authorizeRoles("provider"),
    async (req, res) => {
        try {
            const bookings = await Booking.find({
                $or: [
                    {
                        status: "pending",
                        provider: null
                    },
                    {
                        provider: req.user.userId
                    }
                ]
            })
                .populate("customer", "name email phone")
                .populate("service", "name category price image")
                .populate("provider", "name email phone")
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: bookings.length,
                bookings
            });

        } catch (error) {
            console.error("Get provider bookings error:", error);

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ============================================================
// PROVIDER / ADMIN - ALL BOOKINGS
// ============================================================

router.get(
    "/provider/all",
    protect,
    authorizeRoles("provider", "admin"),
    async (req, res) => {
        try {
            const bookings = await Booking.find()
                .populate("customer", "name email phone")
                .populate("service", "name category price")
                .populate("provider", "name email phone")
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: bookings.length,
                bookings
            });

        } catch (error) {
            console.error("Provider bookings error:", error);

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ============================================================
// PROVIDER - SINGLE BOOKING DETAILS
// ============================================================

router.get(
    "/provider/:id",
    protect,
    authorizeRoles("provider"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid booking ID"
                });
            }

            const booking = await Booking.findById(req.params.id)
                .populate("customer", "name email phone")
                .populate("service", "name category price image")
                .populate("provider", "name email phone");

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }

            console.log("BOOKING PROVIDER:", booking.provider?._id?.toString());
            console.log("LOGGED IN USER:", String(req.user.userId));

            if (
                !booking.provider ||
                booking.provider._id.toString() !== req.user.userId
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You are not assigned to this booking"
                });
            }

            res.status(200).json({
                success: true,
                booking
            });

        } catch (error) {
            console.error(
                "Get provider booking details error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ============================================================
// CUSTOMER - SINGLE BOOKING DETAILS
// ============================================================

router.get(
    "/:id",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid booking ID"
                });
            }

            const booking = await Booking.findOne({
                _id: req.params.id,
                customer: req.user.userId
            })
                .populate("service", "name category price image")
                .populate("provider", "name email phone");

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
            console.error("Get single booking error:", error);

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ============================================================
// PROVIDER - ACCEPT BOOKING
// ============================================================

router.put(
    "/:id/accept",
    protect,
    authorizeRoles("provider"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid booking ID"
                });
            }

            const booking = await Booking.findById(req.params.id);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }

            if (booking.status !== "pending") {
                return res.status(400).json({
                    success: false,
                    message: "Booking cannot be accepted"
                });
            }

            if (booking.provider) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Booking is already assigned to a provider"
                });
            }

            booking.provider = req.user.userId;
            booking.status = "confirmed";

            await booking.save();

            await Notification.create({
                user: booking.customer,
                title: "Booking Confirmed",
                message:
                    "Your booking has been accepted by the service provider.",
                type: "booking",
                isRead: false
            });

            res.status(200).json({
                success: true,
                message: "Booking accepted successfully",
                booking
            });

        } catch (error) {
            console.error("Accept booking error:", error);

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ============================================================
// PROVIDER - UPDATE BOOKING STATUS
// ============================================================

router.put(
    "/:id/status",
    protect,
    authorizeRoles("provider"),
    async (req, res) => {
        try {
            const { status } = req.body;

            const allowedStatuses = [
                "confirmed",
                "in-progress",
                "completed"
            ];

            if (!status || !allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid booking status"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid booking ID"
                });
            }

            const booking = await Booking.findById(req.params.id);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }

            if (
                !booking.provider ||
                booking.provider.toString() !== req.user.userId
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not assigned to this booking"
                });
            }

            if (
                booking.status === "pending" &&
                status !== "confirmed"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Pending booking must be confirmed first"
                });
            }

            if (
                booking.status === "confirmed" &&
                status !== "in-progress"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Confirmed booking can only move to in-progress"
                });
            }

            if (
                booking.status === "in-progress" &&
                status !== "completed"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "In-progress booking can only move to completed"
                });
            }

            if (booking.status === "completed") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Completed booking cannot be updated"
                });
            }

            booking.status = status;

            await booking.save();

            if (status === "in-progress") {
                await Notification.create({
                    user: booking.customer,
                    title: "Service Started",
                    message:
                        "Your service booking is now in progress.",
                    type: "booking",
                    isRead: false
                });
            }

            if (status === "completed") {
                await Notification.create({
                    user: booking.customer,
                    title: "Booking Completed",
                    message:
                        "Your service booking has been completed successfully.",
                    type: "booking",
                    isRead: false
                });
            }

            res.status(200).json({
                success: true,
                message:
                    "Booking status updated successfully",
                booking
            });

        } catch (error) {
            console.error(
                "Update booking status error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ============================================================
// CUSTOMER / PROVIDER - CANCEL BOOKING
// ============================================================

router.put(
    "/:id/cancel",
    protect,
    authorizeRoles("customer", "provider"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid booking ID"
                });
            }

            const booking = await Booking.findById(req.params.id);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }

            if (req.user.role === "customer") {
                if (
                    booking.customer.toString() !==
                    req.user.userId
                ) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "You can only cancel your own booking"
                    });
                }
            }

            if (req.user.role === "provider") {
                if (
                    booking.status === "pending" &&
                    !booking.provider
                ) {
                    booking.status = "cancelled";

                    await booking.save();

                    await Notification.create({
                        user: booking.customer,
                        title: "Booking Rejected",
                        message:
                            "Your booking request was rejected by a service provider.",
                        type: "booking",
                        isRead: false
                    });

                    return res.status(200).json({
                        success: true,
                        message:
                            "Booking rejected successfully",
                        booking
                    });
                }

                if (
                    !booking.provider ||
                    booking.provider.toString() !==
                        req.user.userId
                ) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "You are not assigned to this booking"
                    });
                }
            }

            if (
                booking.status === "in-progress" ||
                booking.status === "completed"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This booking cannot be cancelled"
                });
            }

            if (booking.status === "cancelled") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Booking is already cancelled"
                });
            }

            const cancelledBy = req.user.role;

            booking.status = "cancelled";

            await booking.save();

            if (cancelledBy === "customer") {
                if (booking.provider) {
                    await Notification.create({
                        user: booking.provider,
                        title: "Booking Cancelled",
                        message:
                            "A customer has cancelled the booking.",
                        type: "booking",
                        isRead: false
                    });
                }
            }

            if (cancelledBy === "provider") {
                await Notification.create({
                    user: booking.customer,
                    title: "Booking Cancelled",
                    message:
                        "Your booking has been cancelled by the service provider.",
                    type: "booking",
                    isRead: false
                });
            }

            res.status(200).json({
                success: true,
                message:
                    "Booking cancelled successfully",
                booking
            });

        } catch (error) {
            console.error(
                "Cancel booking error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ============================================================
// ADMIN - CANCEL BOOKING
// ============================================================

router.put(
    "/admin/:id/cancel",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid booking ID"
                });
            }

            const booking = await Booking.findById(
                req.params.id
            );

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }

            if (
                booking.status === "in-progress" ||
                booking.status === "completed"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This booking cannot be cancelled"
                });
            }

            if (booking.status === "cancelled") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Booking is already cancelled"
                });
            }

            booking.status = "cancelled";

            await booking.save();

            await Notification.create({
                user: booking.customer,
                title: "Booking Cancelled",
                message:
                    "Your booking has been cancelled by the administrator.",
                type: "booking",
                isRead: false
            });

            res.status(200).json({
                success: true,
                message:
                    "Booking cancelled successfully by admin",
                booking
            });

        } catch (error) {
            console.error(
                "Admin cancel booking error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


module.exports = router;