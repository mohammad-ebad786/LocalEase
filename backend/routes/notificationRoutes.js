const express = require("express");

const Notification = require("../models/Notification");

// JWT Authentication Middleware
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// CREATE / TEST NOTIFICATION
// Logged-in users
// TEMPORARY TEST API
// ======================================================

router.post(
    "/test",
    protect,
    async (req, res) => {
        try {

            const {
                title,
                message,
                type
            } = req.body;


            // Check required fields
            if (!title || !message) {
                return res.status(400).json({
                    success: false,
                    message: "Title and message are required"
                });
            }


            // Create notification
            const notification = await Notification.create({
                user: req.user.userId,
                title,
                message,
                type: type || "system",
                isRead: false
            });


            res.status(201).json({
                success: true,
                message: "Test notification created successfully",
                notification
            });


        } catch (error) {

            console.error(
                "Create test notification error:",
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
// GET MY NOTIFICATIONS
// Logged-in users
// ======================================================

router.get(
    "/",
    protect,
    async (req, res) => {
        try {

            const notifications = await Notification.find({
                user: req.user.userId
            })
                .sort({ createdAt: -1 });


            const unreadCount =
                await Notification.countDocuments({
                    user: req.user.userId,
                    isRead: false
                });


            res.status(200).json({
                success: true,
                count: notifications.length,
                unreadCount,
                notifications
            });


        } catch (error) {

            console.error(
                "Get my notifications error:",
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
// MARK NOTIFICATION AS READ
// Logged-in users
// ======================================================

router.put(
    "/:id/read",
    protect,
    async (req, res) => {
        try {

            const notification =
                await Notification.findOne({
                    _id: req.params.id,
                    user: req.user.userId
                });


            // Notification not found
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: "Notification not found"
                });
            }


            // Already read
            if (notification.isRead) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Notification is already marked as read"
                });
            }


            // Mark as read
            notification.isRead = true;

            await notification.save();


            res.status(200).json({
                success: true,
                message: "Notification marked as read",
                notification
            });


        } catch (error) {

            console.error(
                "Mark notification as read error:",
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
// MARK ALL NOTIFICATIONS AS READ
// Logged-in users
// ======================================================

router.put(
    "/read-all",
    protect,
    async (req, res) => {
        try {

            const result =
                await Notification.updateMany(
                    {
                        user: req.user.userId,
                        isRead: false
                    },
                    {
                        $set: {
                            isRead: true
                        }
                    }
                );


            res.status(200).json({
                success: true,
                message:
                    "All notifications marked as read",
                modifiedCount: result.modifiedCount
            });


        } catch (error) {

            console.error(
                "Mark all notifications as read error:",
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
// DELETE MY NOTIFICATION
// Logged-in users
// ======================================================

router.delete(
    "/:id",
    protect,
    async (req, res) => {
        try {

            const notification =
                await Notification.findOneAndDelete({
                    _id: req.params.id,
                    user: req.user.userId
                });


            // Notification not found
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: "Notification not found"
                });
            }


            res.status(200).json({
                success: true,
                message:
                    "Notification deleted successfully"
            });


        } catch (error) {

            console.error(
                "Delete notification error:",
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