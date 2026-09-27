const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const ProviderApplication = require("./models/ProviderApplication");

async function makeRoyalProvider() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected ✅");

        // Find existing royal123 account
        const user = await User.findOne({
            email: "royal123@gmail.com"
        });

        if (!user) {
            console.log("User not found ❌");
            return;
        }

        // Change existing account role to provider
        user.role = "provider";
        user.isActive = true;

        await user.save();

        console.log("Royal provider account updated successfully ✅");

        // Find the approved provider application
        const application = await ProviderApplication.findOne({
            email: "royal123@gmail.com",
            status: "approved"
        });

        // Link provider application with user account
        if (application) {
            application.user = user._id;

            await application.save();

            console.log("Provider application linked successfully ✅");
        } else {
            console.log(
                "Approved provider application not found ⚠️"
            );
        }

        // Final confirmation
        console.log("\n===== ROYAL PROVIDER =====");

        console.log({
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            userId: user._id
        });

        if (application) {
            console.log("\n===== PROVIDER APPLICATION =====");

            console.log({
                applicationId: application._id,
                email: application.email,
                status: application.status,
                user: application.user
            });
        }

        console.log("\n============================");

    } catch (error) {

        console.error("Error ❌");
        console.error(error.message);

    } finally {

        await mongoose.disconnect();

        console.log("\nMongoDB disconnected 🔌");
    }
}

makeRoyalProvider();