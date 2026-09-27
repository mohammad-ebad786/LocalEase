const jwt = require("jsonwebtoken");


// ==================================================
// JWT AUTHENTICATION MIDDLEWARE
// ==================================================

const protect = (req, res, next) => {
    try {

        // ==================================================
        // GET AUTHORIZATION HEADER
        // ==================================================

        const authHeader = req.headers.authorization;


        // ==================================================
        // CHECK AUTHORIZATION HEADER
        // ==================================================

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }


        // ==================================================
        // EXTRACT TOKEN
        // ==================================================

        const token = authHeader.split(" ")[1];


        // ==================================================
        // CHECK TOKEN EXISTS
        // ==================================================

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }


        // ==================================================
        // CHECK JWT SECRET
        // ==================================================

        if (!process.env.JWT_SECRET) {
            console.error(
                "❌ JWT_SECRET is not configured in .env"
            );

            return res.status(500).json({
                success: false,
                message: "Server configuration error"
            });
        }


        // ==================================================
        // VERIFY JWT TOKEN
        // ==================================================

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // ==================================================
        // ATTACH USER DATA TO REQUEST
        // ==================================================

        req.user = decoded;


        console.log(
            "✅ JWT verified:",
            {
                userId: req.user.userId,
                role: req.user.role
            }
        );


        // ==================================================
        // CONTINUE
        // ==================================================

        next();

    } catch (error) {

        console.error(
            "❌ JWT verification error:",
            error.message
        );


        // ==================================================
        // INVALID / EXPIRED TOKEN
        // ==================================================

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};



// ==================================================
// ROLE-BASED AUTHORIZATION
// ==================================================
// NOTE:
// Most application routes currently use
// middleware/roleMiddleware.js.
// This function is kept here for compatibility
// with any route that directly imports { authorize }.
// ==================================================

const authorize = (...allowedRoles) => {

    return (req, res, next) => {

        // ==================================================
        // CHECK AUTHENTICATION
        // ==================================================

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }


        // ==================================================
        // CHECK ROLE
        // ==================================================

        if (
            !allowedRoles.includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Access denied. You do not have permission."
            });
        }


        // ==================================================
        // ROLE AUTHORIZED
        // ==================================================

        console.log(
            "✅ Role authorized:",
            req.user.role
        );


        next();
    };
};



// ==================================================
// EXPORT MIDDLEWARES
// ==================================================

module.exports = {
    protect,
    authorize
};