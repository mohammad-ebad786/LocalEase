const express = require("express");
const mongoose = require("mongoose");

const Review = require("../models/Review");
const Booking = require("../models/Booking");
const User = require("../models/User");

// JWT Authentication Middleware
const { protect } = require("../middleware/authMiddleware");

// Role-Based Authorization Middleware
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ======================================================
// CREATE REVIEW
// Customer only
// ======================================================

router.post(
    "/",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {
        try {

            const {
                bookingId,
                rating,
                comment
            } = req.body;


            // Check required fields
            if (!bookingId || rating === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Booking ID and rating are required"
                });
            }


            // Validate booking ID
            if (!mongoose.Types.ObjectId.isValid(bookingId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid booking ID"
                });
            }


            // Validate rating
            const numericRating = Number(rating);

            if (
                !Number.isInteger(numericRating) ||
                numericRating < 1 ||
                numericRating > 5
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be an integer between 1 and 5"
                });
            }


            // Validate comment
            if (
                comment !== undefined &&
                typeof comment !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Comment must be a text value"
                });
            }


            if (
                comment &&
                comment.trim().length > 500
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Comment cannot exceed 500 characters"
                });
            }


            // Find customer's booking
            const booking = await Booking.findOne({
                _id: bookingId,
                customer: req.user.userId
            });


            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });
            }


            // Only completed bookings can be reviewed
            if (booking.status !== "completed") {
                return res.status(400).json({
                    success: false,
                    message: "You can review only completed bookings"
                });
            }


            // Provider must be assigned
            if (!booking.provider) {
                return res.status(400).json({
                    success: false,
                    message: "This booking has no assigned provider"
                });
            }


            // Check existing review
            const existingReview = await Review.findOne({
                booking: booking._id
            });


            if (existingReview) {
                return res.status(409).json({
                    success: false,
                    message: "Review already submitted for this booking"
                });
            }


            // Create review
            const review = await Review.create({
                customer: req.user.userId,
                service: booking.service,
                booking: booking._id,
                rating: numericRating,
                comment: comment
                    ? comment.trim()
                    : ""
            });


            res.status(201).json({
                success: true,
                message: "Review submitted successfully",
                review
            });


        } catch (error) {

            console.error("Create review error:", error);


            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "Review already submitted for this booking"
                });
            }


            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ======================================================
// GET SERVICE REVIEWS
// Public API
// ======================================================

router.get(
    "/service/:serviceId",
    async (req, res) => {
        try {

            const {
                serviceId
            } = req.params;


            if (!mongoose.Types.ObjectId.isValid(serviceId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid service ID"
                });
            }


            const reviews = await Review.find({
                service: serviceId
            })
                .populate("customer", "name")
                .populate("service", "name category")
                .sort({ createdAt: -1 });


            const totalReviews = reviews.length;

            const averageRating =
                totalReviews > 0
                    ? Number(
                        (
                            reviews.reduce(
                                (sum, review) =>
                                    sum + review.rating,
                                0
                            ) / totalReviews
                        ).toFixed(1)
                    )
                    : 0;


            res.status(200).json({
                success: true,
                count: totalReviews,
                averageRating,
                reviews
            });


        } catch (error) {

            console.error(
                "Get service reviews error:",
                error
            );


            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ======================================================
// GET PROVIDER REVIEWS
// Public API
// ======================================================

router.get(
    "/provider/:providerId",
    async (req, res) => {
        try {

            const {
                providerId
            } = req.params;


            if (!mongoose.Types.ObjectId.isValid(providerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid provider ID"
                });
            }


            const provider = await User.findOne({
                _id: providerId,
                role: "provider"
            }).select("_id name");


            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: "Provider not found"
                });
            }


            const bookings = await Booking.find({
                provider: providerId,
                status: "completed"
            }).select("_id");


            const bookingIds = bookings.map(
                booking => booking._id
            );


            const reviews = await Review.find({
                booking: {
                    $in: bookingIds
                }
            })
                .populate("customer", "name")
                .populate("service", "name category")
                .sort({ createdAt: -1 });


            const totalReviews = reviews.length;

            const averageRating =
                totalReviews > 0
                    ? Number(
                        (
                            reviews.reduce(
                                (sum, review) =>
                                    sum + review.rating,
                                0
                            ) / totalReviews
                        ).toFixed(1)
                    )
                    : 0;


            res.status(200).json({
                success: true,
                provider: {
                    id: provider._id,
                    name: provider.name
                },
                count: totalReviews,
                averageRating,
                reviews
            });


        } catch (error) {

            console.error(
                "Get provider reviews error:",
                error
            );


            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ======================================================
// GET MY REVIEWS
// Customer only
// ======================================================

router.get(
    "/my-reviews",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {
        try {

            const reviews = await Review.find({
                customer: req.user.userId
            })
                .populate(
                    "service",
                    "name category price image"
                )
                .populate(
                    "booking",
                    "bookingDate status totalPrice provider"
                )
                .sort({ createdAt: -1 });


            res.status(200).json({
                success: true,
                count: reviews.length,
                reviews
            });


        } catch (error) {

            console.error(
                "Get my reviews error:",
                error
            );


            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ======================================================
// GET SINGLE REVIEW
// Public API
// ======================================================

router.get(
    "/:id",
    async (req, res) => {
        try {

            const {
                id
            } = req.params;


            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid review ID"
                });
            }


            const review = await Review.findById(id)
                .populate("customer", "name")
                .populate(
                    "service",
                    "name category price image"
                )
                .populate(
                    "booking",
                    "bookingDate status totalPrice"
                );


            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: "Review not found"
                });
            }


            res.status(200).json({
                success: true,
                review
            });


        } catch (error) {

            console.error(
                "Get single review error:",
                error
            );


            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ======================================================
// UPDATE MY REVIEW
// Customer only
// ======================================================

router.put(
    "/:id",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {
        try {

            const {
                id
            } = req.params;

            const {
                rating,
                comment
            } = req.body;


            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid review ID"
                });
            }


            if (
                rating === undefined &&
                comment === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Rating or comment is required"
                });
            }


            let numericRating;

            if (rating !== undefined) {

                numericRating = Number(rating);

                if (
                    !Number.isInteger(numericRating) ||
                    numericRating < 1 ||
                    numericRating > 5
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Rating must be an integer between 1 and 5"
                    });
                }
            }


            if (
                comment !== undefined &&
                typeof comment !== "string"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Comment must be a text value"
                });
            }


            if (
                comment !== undefined &&
                comment.trim().length > 500
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Comment cannot exceed 500 characters"
                });
            }


            const review = await Review.findOne({
                _id: id,
                customer: req.user.userId
            });


            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: "Review not found"
                });
            }


            if (rating !== undefined) {
                review.rating = numericRating;
            }


            if (comment !== undefined) {
                review.comment = comment.trim();
            }


            await review.save();


            res.status(200).json({
                success: true,
                message: "Review updated successfully",
                review
            });


        } catch (error) {

            console.error(
                "Update review error:",
                error
            );


            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ======================================================
// DELETE MY REVIEW
// Customer only
// ======================================================

router.delete(
    "/:id",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {
        try {

            const {
                id
            } = req.params;


            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid review ID"
                });
            }


            const review = await Review.findOne({
                _id: id,
                customer: req.user.userId
            });


            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: "Review not found"
                });
            }
            

            await review.deleteOne();


            res.status(200).json({
                success: true,
                message: "Review deleted successfully"
            });


        } catch (error) {

            console.error(
                "Delete review error:",
                error
            );


            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;