const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

// MAKE USER ADMIN
async function makeAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected ✅");

        const user = await User.findOneAndUpdate(
            { email: "stargirlaamna@gmail.com" },
            {
                role: "admin",
                isActive: true
            },
            {
                returnDocument: "after"
            }
        );

        if (!user) {
            console.log("User not found ❌");
            return;
        }

        console.log("Admin account updated successfully ✅");

        console.log({
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        });

    } catch (error) {
        console.error("Error ❌");
        console.error(error.message);

    } finally {
        await mongoose.disconnect();
    }
}

// RUN SCRIPT
makeAdmin();