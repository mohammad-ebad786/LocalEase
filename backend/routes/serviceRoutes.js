const express = require("express");
const Service = require("../models/Service");

// Authentication middleware
const { protect } = require("../middleware/authMiddleware");

// Role-based authorization middleware
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// CREATE SERVICE
// Provider + Admin only
router.post(
    "/",
    protect,
    authorizeRoles("provider", "admin"),
    async (req, res) => {
        try {

            const {
                name,
                description,
                category,
                price,
                image
            } = req.body;


            // Validate required fields
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


            // Create service
            const service = await Service.create({
                name: name.trim(),
                description: description.trim(),
                category: category.trim(),
                price,
                image: image || "",
                provider:
                    req.user.role === "provider"
                        ? req.user.userId
                        : null
            });


            res.status(201).json({
                success: true,
                message: "Service created successfully",
                service
            });


        } catch (error) {

            console.error(
                "Create service error:",
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
// Public API
router.get(
    "/",
    async (req, res) => {
        try {

            const services = await Service.find({
                isActive: true
            })
                .populate(
                    "provider",
                    "name email"
                )
                .sort({ createdAt: -1 });


            res.status(200).json({
                success: true,
                count: services.length,
                services
            });


        } catch (error) {

            console.error(
                "Get services error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// GET PROVIDER SERVICES
// Provider only
router.get(
    "/provider/my-services",
    protect,
    authorizeRoles("provider"),
    async (req, res) => {
        try {

            const services = await Service.find({
                provider: req.user.userId,
                isActive: true
            }).sort({ createdAt: -1 });


            res.status(200).json({
                success: true,
                count: services.length,
                services
            });


        } catch (error) {

            console.error(
                "Get provider services error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);


// GET SINGLE SERVICE
// Public API
router.get(
    "/:id",
    async (req, res) => {
        try {

            const service = await Service.findById(
                req.params.id
            )
                .populate(
                    "provider",
                    "name email"
                );


            if (!service || !service.isActive) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found"
                });
            }


            res.status(200).json({
                success: true,
                service
            });


        } catch (error) {

            console.error(
                "Get single service error:",
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
// Provider + Admin only
router.put(
    "/:id",
    protect,
    authorizeRoles("provider", "admin"),
    async (req, res) => {
        try {

            const {
                name,
                description,
                category,
                price,
                image,
                isActive
            } = req.body;


            // Find service
            const service = await Service.findById(
                req.params.id
            );


            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found"
                });
            }


            // Provider can update only their own services
            if (
                req.user.role === "provider" &&
                (
                    !service.provider ||
                    service.provider.toString() !==
                        req.user.userId.toString()
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You can update only your own services"
                });
            }


            // Update only provided fields
            if (name !== undefined) {
                service.name = name.trim();
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
                service.price = price;
            }

            if (image !== undefined) {
                service.image = image;
            }

            if (isActive !== undefined) {
                service.isActive = isActive;
            }


            await service.save();


            res.status(200).json({
                success: true,
                message: "Service updated successfully",
                service
            });


        } catch (error) {

            console.error(
                "Update service error:",
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
// Provider + Admin only
// Soft delete
router.delete(
    "/:id",
    protect,
    authorizeRoles("provider", "admin"),
    async (req, res) => {
        try {

            const service = await Service.findById(
                req.params.id
            );


            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found"
                });
            }


            // Provider can delete only their own services
            if (
                req.user.role === "provider" &&
                (
                    !service.provider ||
                    service.provider.toString() !==
                        req.user.userId.toString()
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You can delete only your own services"
                });
            }


            // Soft delete
            service.isActive = false;

            await service.save();


            res.status(200).json({
                success: true,
                message: "Service deleted successfully"
            });


        } catch (error) {

            console.error(
                "Delete service error:",
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