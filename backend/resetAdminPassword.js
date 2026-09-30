const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

// RESET ADMIN PASSWORD
async function resetAdminPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected ✅");

        const newPassword = "LocalEase@2026";

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Find admin account and update password
        const admin = await User.findOneAndUpdate(
            { email: "admin@localease.com", role: "admin" },
            {
                password: hashedPassword,
                isActive: true
            },
            {
                returnDocument: "after"
            }
        );

        if (!admin) {
            console.log("Admin account not found ❌");
            return;
        }

        console.log("\nAdmin password reset successfully ✅");

        console.log({
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive
        });

        // Display login credentials
        console.log("\nLogin credentials:");
        console.log("Email: admin@localease.com");
        console.log("Password: LocalEase@2026");

    } catch (error) {
        console.error("Error ❌");
        console.error(error.message);

    } finally {
        await mongoose.disconnect();
    }
}

// RUN SCRIPT
resetAdminPassword();