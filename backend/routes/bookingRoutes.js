const express = require("express");

const mongoose = require("mongoose");

const router = express.Router();

const Booking = require("../models/Booking");
const Service = require("../models/Service");
const ProviderApplication = require(
    "../models/ProviderApplication"
);
const Notification = require(
    "../models/Notification"
);

const {
    protect
} = require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");


// ==================================================
// CREATE BOOKING
// ==================================================

router.post(
    "/",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {

        try {

            const {
                service,
                provider,
                bookingDate,
                address,
                phone,
                notes
            } = req.body;


            // ==================================================
            // BASIC VALIDATION
            // ==================================================

            if (
                !service ||
                !bookingDate ||
                !address ||
                !phone
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Service, booking date, address and phone are required."
                });

            }


            // ==================================================
            // VALIDATE SERVICE ID
            // ==================================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    service
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid service ID."
                });

            }


            // ==================================================
            // FIND ACTIVE SERVICE
            // ==================================================

            const serviceData =
                await Service.findOne({
                    _id: service,
                    isActive: true
                });


            if (!serviceData) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Service not found or inactive."
                });

            }


            // ==================================================
            // FIND ELIGIBLE PROVIDERS
            // ==================================================

            let eligibleProviders = [];


            // ==================================================
            // SELECTED PROVIDER BOOKING
            // ==================================================

            if (provider) {

                if (
                    !mongoose.Types.ObjectId.isValid(
                        provider
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid provider ID."
                    });

                }


                const selectedProviderApplication =
                    await ProviderApplication.findOne({
                        user: provider,
                        serviceCategory:
                            serviceData.category,
                        status: "approved"
                    }).select("user");


                if (
                    !selectedProviderApplication
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Selected provider is not approved for this service."
                    });

                }


                eligibleProviders = [
                    selectedProviderApplication.user.toString()
                ];

            }


            // ==================================================
            // NORMAL SERVICE BOOKING
            // ==================================================

            else {

                const approvedProviderApplications =
                    await ProviderApplication.find({
                        serviceCategory:
                            serviceData.category,
                        status: "approved",
                        user: {
                            $ne: null
                        }
                    }).select("user");


                eligibleProviders = [
                    ...new Set(
                        approvedProviderApplications
                            .map(
                                function (
                                    application
                                ) {

                                    return application
                                        .user
                                        ?.toString();

                                }
                            )
                            .filter(Boolean)
                    )
                ];

            }


            // ==================================================
            // CREATE BOOKING
            // ==================================================

            const booking =
                await Booking.create({

                    customer:
                        req.user.userId,

                    service:
                        serviceData._id,

                    bookingDate,

                    address,

                    phone,

                    notes:
                        notes || "",

                    totalPrice:
                        serviceData.price,

                    eligibleProviders,

                    status:
                        "pending"

                });


            // ==================================================
            // SEND NEW BOOKING NOTIFICATION
            // ==================================================

            if (
                eligibleProviders.length >
                0
            ) {

                await Notification.insertMany(
                    eligibleProviders.map(
                        function (
                            providerId
                        ) {

                            return {
                                user:
                                    providerId,

                                title:
                                    "New Booking Request",

                                message:
                                    `A new ${serviceData.name} booking request is available.`,

                                type:
                                    "booking",

                                isRead:
                                    false
                            };

                        }
                    )
                );

            }


            // ==================================================
            // RESPONSE
            // ==================================================

            return res.status(201).json({

                success: true,

                message:
                    "Booking created successfully",

                booking

            });


        } catch (error) {

            console.error(
                "Create booking error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to create booking."

            });

        }

    }
);


// ==================================================
// GET CUSTOMER BOOKINGS
// ==================================================

router.get(
    "/my-bookings",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {

        try {

            const bookings =
                await Booking.find({
                    customer:
                        req.user.userId
                })
                    .populate(
                        "service",
                        "name category price image"
                    )
                    .populate(
                        "provider",
                        "name email phone location"
                    )
                    .sort({
                        createdAt: -1
                    });


            return res.json({

                success: true,

                bookings

            });


        } catch (error) {

            console.error(
                "Customer bookings error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load bookings."

            });

        }

    }
);


// ==================================================
// GET PROVIDER BOOKINGS
// ==================================================

router.get(
    "/provider/my-bookings",
    protect,
    authorizeRoles("provider"),
    async (req, res) => {

        try {

            const bookings =
                await Booking.find({

                    $or: [

                        {
                            status:
                                "pending",

                            provider:
                                null,

                            eligibleProviders:
                                req.user.userId
                        },

                        {
                            provider:
                                req.user.userId
                        }

                    ]

                })
                    .populate(
                        "customer",
                        "name email phone location"
                    )
                    .populate(
                        "service",
                        "name category price image"
                    )
                    .populate(
                        "provider",
                        "name email phone location"
                    )
                    .sort({
                        createdAt: -1
                    });


            return res.json({

                success: true,

                bookings

            });


        } catch (error) {

            console.error(
                "Provider bookings error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load provider bookings."

            });

        }

    }
);


// ==================================================
// GET ALL PROVIDER BOOKINGS
// ==================================================

router.get(
    "/provider/all",
    protect,
    authorizeRoles(
        "provider",
        "admin"
    ),
    async (req, res) => {

        try {

            let query = {};


            // ==================================================
            // PROVIDER CAN SEE OWN ASSIGNED BOOKINGS
            // ==================================================

            if (
                req.user.role ===
                "provider"
            ) {

                query = {
                    provider:
                        req.user.userId
                };

            }


            const bookings =
                await Booking.find(
                    query
                )
                    .populate(
                        "customer",
                        "name email phone location"
                    )
                    .populate(
                        "service",
                        "name category price image"
                    )
                    .populate(
                        "provider",
                        "name email phone location"
                    )
                    .sort({
                        createdAt: -1
                    });


            return res.json({

                success: true,

                bookings

            });


        } catch (error) {

            console.error(
                "Provider all bookings error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load bookings."

            });

        }

    }
);


// ==================================================
// GET SINGLE PROVIDER BOOKING
// ==================================================

router.get(
    "/provider/:id",
    protect,
    authorizeRoles("provider"),
    async (req, res) => {

        try {

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.params.id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid booking ID."

                });

            }


            const booking =
                await Booking.findOne({

                    _id:
                        req.params.id,

                    provider:
                        req.user.userId

                })
                    .populate(
                        "customer",
                        "name email phone location"
                    )
                    .populate(
                        "service",
                        "name category price image"
                    )
                    .populate(
                        "provider",
                        "name email phone location"
                    );


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found."

                });

            }


            return res.json({

                success: true,

                booking

            });


        } catch (error) {

            console.error(
                "Single provider booking error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load booking."

            });

        }

    }
);


// ==================================================
// GET SINGLE CUSTOMER BOOKING
// ==================================================

router.get(
    "/:id",
    protect,
    authorizeRoles("customer"),
    async (req, res) => {

        try {

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.params.id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid booking ID."

                });

            }


            const booking =
                await Booking.findOne({

                    _id:
                        req.params.id,

                    customer:
                        req.user.userId

                })
                    .populate(
                        "customer",
                        "name email phone location"
                    )
                    .populate(
                        "service",
                        "name category price image"
                    )
                    .populate(
                        "provider",
                        "name email phone location"
                    );


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found."

                });

            }


            return res.json({

                success: true,

                booking

            });


        } catch (error) {

            console.error(
                "Single customer booking error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load booking."

            });

        }

    }
);


// ==================================================
// PROVIDER ACCEPT BOOKING
// ==================================================

router.put(
    "/:id/accept",
    protect,
    authorizeRoles("provider"),
    async (req, res) => {

        try {

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.params.id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid booking ID."

                });

            }


            // ==================================================
            // ATOMIC ACCEPTANCE
            // ==================================================

            const booking =
                await Booking.findOneAndUpdate(

                    {
                        _id:
                            req.params.id,

                        status:
                            "pending",

                        provider:
                            null,

                        eligibleProviders:
                            req.user.userId
                    },

                    {
                        $set: {

                            provider:
                                req.user.userId,

                            status:
                                "confirmed"

                        }
                    },

                    {
                        new: true
                    }

                )
                    .populate(
                        "customer",
                        "name email phone"
                    )
                    .populate(
                        "service",
                        "name category price"
                    )
                    .populate(
                        "provider",
                        "name email phone location"
                    );


            if (!booking) {

                const existingBooking =
                    await Booking.findById(
                        req.params.id
                    );


                if (!existingBooking) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Booking not found."

                    });

                }


                if (
                    existingBooking.status !==
                    "pending"
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Booking is no longer available."

                    });

                }


                if (
                    existingBooking.provider
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Booking has already been accepted by another provider."

                    });

                }


                const isEligible =
                    Array.isArray(
                        existingBooking.eligibleProviders
                    ) &&
                    existingBooking.eligibleProviders.some(
                        function (
                            providerId
                        ) {

                            return (
                                String(
                                    providerId
                                ) ===
                                String(
                                    req.user.userId
                                )
                            );

                        }
                    );


                if (!isEligible) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "You are not eligible to accept this booking."

                    });

                }


                return res.status(400).json({

                    success: false,

                    message:
                        "Booking cannot be accepted."

                });

            }


            // ==================================================
            // CUSTOMER NOTIFICATION
            // ==================================================

            await Notification.create({

                user:
                    booking.customer._id,

                title:
                    "Booking Confirmed",

                message:
                    "Your booking has been accepted by the service provider.",

                type:
                    "booking",

                isRead:
                    false

            });


            return res.json({

                success: true,

                message:
                    "Booking accepted successfully.",

                booking

            });


        } catch (error) {

            console.error(
                "Accept booking error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to accept booking."

            });

        }

    }
);


// ==================================================
// PROVIDER REJECT BOOKING
// ==================================================

router.put(
    "/:id/reject",
    protect,
    authorizeRoles("provider"),
    async (req, res) => {

        try {

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.params.id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid booking ID."

                });

            }


            // ==================================================
            // ATOMIC REJECTION
            // ==================================================

            const booking =
                await Booking.findOneAndUpdate(

                    {
                        _id:
                            req.params.id,

                        status:
                            "pending",

                        provider:
                            null,

                        eligibleProviders:
                            req.user.userId
                    },

                    {
                        $set: {

                            status:
                                "rejected"

                        }
                    },

                    {
                        new: true
                    }

                );


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found or no longer available."

                });

            }


            // ==================================================
            // CUSTOMER NOTIFICATION
            // ==================================================

            await Notification.create({

                user:
                    booking.customer,

                title:
                    "Booking Rejected",

                message:
                    "Your booking request was rejected by a service provider.",

                type:
                    "booking",

                isRead:
                    false

            });


            return res.json({

                success: true,

                message:
                    "Booking rejected successfully.",

                booking

            });


        } catch (error) {

            console.error(
                "Reject booking error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to reject booking."

            });

        }

    }
);


// ==================================================
// UPDATE BOOKING STATUS
// ==================================================

router.put(
    "/:id/status",
    protect,
    authorizeRoles("provider"),
    async (req, res) => {

        try {

            const {
                status
            } = req.body;


            // ==================================================
            // VALIDATE BOOKING ID
            // ==================================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.params.id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid booking ID."

                });

            }


            // ==================================================
            // VALIDATE STATUS
            // ==================================================

            const allowedStatuses = [
                "in-progress",
                "completed"
            ];


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid booking status."

                });

            }


            // ==================================================
            // FIND PROVIDER BOOKING
            // ==================================================

            const booking =
                await Booking.findOne({

                    _id:
                        req.params.id,

                    provider:
                        req.user.userId

                });


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found."

                });

            }


            // ==================================================
            // VALIDATE STATUS TRANSITION
            // ==================================================

            if (
                status ===
                "in-progress"
            ) {

                if (
                    booking.status !==
                    "confirmed"
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Only confirmed bookings can be started."

                    });

                }

            }


            if (
                status ===
                "completed"
            ) {

                if (
                    booking.status !==
                    "in-progress"
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Only in-progress bookings can be completed."

                    });

                }

            }


            booking.status =
                status;


            await booking.save();


            // ==================================================
            // CUSTOMER NOTIFICATION
            // ==================================================

            if (
                status ===
                "in-progress"
            ) {

                await Notification.create({

                    user:
                        booking.customer,

                    title:
                        "Booking Started",

                    message:
                        "Your service provider has started your booking.",

                    type:
                        "booking",

                    isRead:
                        false

                });

            }


            if (
                status ===
                "completed"
            ) {

                await Notification.create({

                    user:
                        booking.customer,

                    title:
                        "Booking Completed",

                    message:
                        "Your service booking has been completed successfully.",

                    type:
                        "booking",

                    isRead:
                        false

                });

            }


            const updatedBooking =
                await Booking.findById(
                    booking._id
                )
                    .populate(
                        "customer",
                        "name email phone location"
                    )
                    .populate(
                        "service",
                        "name category price"
                    )
                    .populate(
                        "provider",
                        "name email phone location"
                    );


            return res.json({

                success: true,

                message:
                    "Booking status updated successfully.",

                booking:
                    updatedBooking

            });


        } catch (error) {

            console.error(
                "Update booking status error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to update booking status."

            });

        }

    }
);


// ==================================================
// CANCEL BOOKING
// ==================================================

router.put(
    "/:id/cancel",
    protect,
    authorizeRoles(
        "customer",
        "provider"
    ),
    async (req, res) => {

        try {

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.params.id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid booking ID."

                });

            }


            let booking;


            // ==================================================
            // CUSTOMER CANCELLATION
            // ==================================================

            if (
                req.user.role ===
                "customer"
            ) {

                booking =
                    await Booking.findOne({

                        _id:
                            req.params.id,

                        customer:
                            req.user.userId

                    });

            }


            // ==================================================
            // PROVIDER CANCELLATION
            // ==================================================

            if (
                req.user.role ===
                "provider"
            ) {

                booking =
                    await Booking.findOne({

                        _id:
                            req.params.id,

                        provider:
                            req.user.userId

                    });

            }


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found."

                });

            }


            // ==================================================
            // PREVENT CANCELLING COMPLETED BOOKING
            // ==================================================

            if (
                booking.status ===
                "completed"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Completed bookings cannot be cancelled."

                });

            }


            booking.status =
                "cancelled";


            await booking.save();


            // ==================================================
            // SEND NOTIFICATION
            // ==================================================

            if (
                req.user.role ===
                "customer" &&
                booking.provider
            ) {

                await Notification.create({

                    user:
                        booking.provider,

                    title:
                        "Booking Cancelled",

                    message:
                        "A customer has cancelled the booking.",

                    type:
                        "booking",

                    isRead:
                        false

                });

            }


            if (
                req.user.role ===
                "provider"
            ) {

                await Notification.create({

                    user:
                        booking.customer,

                    title:
                        "Booking Cancelled",

                    message:
                        "Your service provider has cancelled the booking.",

                    type:
                        "booking",

                    isRead:
                        false

                });

            }


            return res.json({

                success: true,

                message:
                    "Booking cancelled successfully.",

                booking

            });


        } catch (error) {

            console.error(
                "Cancel booking error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to cancel booking."

            });

        }

    }
);


// ==================================================
// ADMIN CANCEL BOOKING
// ==================================================

router.put(
    "/admin/:id/cancel",
    protect,
    authorizeRoles("admin"),
    async (req, res) => {

        try {

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.params.id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid booking ID."

                });

            }


            const booking =
                await Booking.findById(
                    req.params.id
                );


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found."

                });

            }


            if (
                booking.status ===
                "completed"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Completed bookings cannot be cancelled."

                });

            }


            booking.status =
                "cancelled";


            await booking.save();


            // ==================================================
            // CUSTOMER NOTIFICATION
            // ==================================================

            await Notification.create({

                user:
                    booking.customer,

                title:
                    "Booking Cancelled",

                message:
                    "Your booking has been cancelled by the administrator.",

                type:
                    "booking",

                isRead:
                    false

            });


            // ==================================================
            // PROVIDER NOTIFICATION
            // ==================================================

            if (
                booking.provider
            ) {

                await Notification.create({

                    user:
                        booking.provider,

                    title:
                        "Booking Cancelled",

                    message:
                        "A booking assigned to you has been cancelled by the administrator.",

                    type:
                        "booking",

                    isRead:
                        false

                });

            }


            return res.json({

                success: true,

                message:
                    "Booking cancelled successfully.",

                booking

            });


        } catch (error) {

            console.error(
                "Admin cancel booking error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to cancel booking."

            });

        }

    }
);


module.exports = router;