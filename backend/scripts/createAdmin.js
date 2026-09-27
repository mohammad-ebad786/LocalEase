const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/User");


// ==================================================
// CREATE ADMIN USER
// ==================================================

const createAdmin = async () => {

    try {

        // Connect MongoDB
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully ✅");


        // Admin details
        const name = "LocalEase Admin";
        const email = "admin@localease.com";
        const phone = "9876543215";
        const password = "Admin@12345";


        // Check if admin already exists
        const existingAdmin = await User.findOne({
            email: email.toLowerCase()
        });


        if (existingAdmin) {

            console.log("❌ Admin already exists");

            await mongoose.connection.close();

            return;
        }


        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // Create admin
        const admin = await User.create({

            name,

            email: email.toLowerCase(),

            phone,

            password: hashedPassword,

            role: "admin",

            isActive: true

        });


        console.log("======================================");
        console.log("✅ ADMIN CREATED SUCCESSFULLY");
        console.log("======================================");

        console.log("ID:", admin._id.toString());
        console.log("Name:", admin.name);
        console.log("Email:", admin.email);
        console.log("Phone:", admin.phone);
        console.log("Role:", admin.role);
        console.log("Password:", password);

        console.log("======================================");


        // Close connection
        await mongoose.connection.close();

        console.log("MongoDB connection closed ✅");


    } catch (error) {

        console.error(
            "❌ Admin creation failed:",
            error.message
        );

        process.exit(1);
    }
};


// ==================================================
// RUN
// ==================================================

createAdmin();