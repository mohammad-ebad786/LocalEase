const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // ==================================================
        // USER NAME
        // ==================================================
        name: {
            type: String,
            required: true,
            trim: true
        },

        // ==================================================
        // EMAIL
        // ==================================================
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // ==================================================
// PHONE
// ==================================================
phone: {
    type: String,
    required: true,
    trim: true
},

// ==================================================
// LOCATION
// ==================================================
location: {
    type: String,
    trim: true,
    default: ""
},

// ==================================================
// PASSWORD
// ==================================================
password: {
    type: String,
    required: true
},

        // ==================================================
        // USER ROLE
        // customer / provider / admin
        // ==================================================
        role: {
            type: String,
            enum: ["customer", "provider", "admin"],
            default: "customer"
        },

        // ==================================================
        // ACCOUNT STATUS
        // Used by Admin to activate/deactivate users
        // ==================================================
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);


// ======================================================
// EXPORT USER MODEL
// ======================================================

module.exports = mongoose.model("User", userSchema);