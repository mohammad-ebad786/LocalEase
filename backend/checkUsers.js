const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

async function checkUsers() {
    try {

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log("MongoDB connected ✅");

        const users = await User.find()
            .select("name email role isActive createdAt")
            .sort({ createdAt: 1 });

        console.log("\n===== LOCALEASE USERS =====\n");

        if (users.length === 0) {
            console.log("No users found ❌");
            return;
        }

        users.forEach((user, index) => {

            console.log(
                `${index + 1}.`,
                {
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                }
            );

        });

        console.log("\n============================\n");

    } catch (error) {

        console.error("Error ❌");
        console.error(error.message);

    } finally {

        await mongoose.disconnect();

    }
}

checkUsers();