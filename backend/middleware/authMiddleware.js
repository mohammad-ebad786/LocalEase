const jwt = require("jsonwebtoken");

// JWT AUTHENTICATION MIDDLEWARE
const protect = (req, res, next) => {
    try {
        // Get authorization header
        const authHeader = req.headers.authorization;

        // Check authorization header
        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Check token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            console.error(
                "❌ JWT_SECRET is not configured in .env"
            );

            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Attach user data to request
        req.user = decoded;

        console.log(
            "✅ JWT verified:",
            {
                userId: req.user.userId,
                role: req.user.role
            }
        );

        // Continue to next middleware
        next();

    } catch (error) {
        console.error(
            "❌ JWT verification error:",
            error.message
        );

        // Handle invalid or expired token
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

// ROLE-BASED AUTHORIZATION
// Most application routes currently use
// middleware/roleMiddleware.js.
// This function is kept for compatibility
// with routes that directly import { authorize }.
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Check authentication
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Check user role
        if (
            !allowedRoles.includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Access denied. You do not have permission."
            });
        }

        // Role authorized
        console.log(
            "✅ Role authorized:",
            req.user.role
        );

        next();
    };
};

// EXPORT MIDDLEWARES
module.exports = {
    protect,
    authorize
};