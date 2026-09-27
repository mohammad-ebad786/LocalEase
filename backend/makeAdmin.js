const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

async function makeProvider() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected ✅");

        const user = await User.findOneAndUpdate(
            { email: "stargirlaamna@gmail.com" },
            {
                role: "provider",
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

        console.log("Provider account updated successfully ✅");

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

makeProvider();