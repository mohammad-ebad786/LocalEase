const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function resetAdminPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected ✅");

        const newPassword = "LocalEase@2026";

        const hashedPassword = await bcrypt.hash(newPassword, 10);

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

resetAdminPassword();