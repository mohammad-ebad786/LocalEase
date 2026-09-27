const express = require("express");

const ProviderApplication = require("../models/ProviderApplication");

const router = express.Router();


// ======================================================
// SUBMIT PROVIDER APPLICATION
// POST /api/provider/apply
// Public route
// ======================================================

router.post(
    "/apply",
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


            // ==============================================
            // VALIDATE REQUIRED FIELDS
            // ==============================================

            if (
                !name ||
                !phone ||
                !email ||
                !location ||
                !serviceCategory ||
                experience === undefined ||
                price === undefined ||
                !description
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "All provider application fields are required"
                });

            }


            // ==============================================
            // VALIDATE EXPERIENCE
            // ==============================================

            if (
                typeof experience !== "number" ||
                experience < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Experience must be a valid number"
                });

            }


            // ==============================================
            // VALIDATE PRICE
            // ==============================================

            if (
                typeof price !== "number" ||
                price < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Price must be a valid number"
                });

            }


            // ==============================================
            // CHECK EXISTING PENDING APPLICATION
            // ==============================================

            const existingApplication =
                await ProviderApplication.findOne({
                    email: email.toLowerCase().trim(),
                    status: "pending"
                });


            if (existingApplication) {

                return res.status(409).json({
                    success: false,
                    message:
                        "A provider application with this email is already pending"
                });

            }


            // ==============================================
            // CREATE APPLICATION
            // ==============================================

            const application =
                await ProviderApplication.create({

                    name: name.trim(),

                    phone: phone.trim(),

                    email: email
                        .toLowerCase()
                        .trim(),

                    location: location.trim(),

                    serviceCategory:
                        serviceCategory.trim(),

                    experience,

                    price,

                    description:
                        description.trim(),

                    status: "pending"

                });


            // ==============================================
            // SUCCESS RESPONSE
            // ==============================================

            res.status(201).json({

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


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;