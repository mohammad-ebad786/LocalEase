const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Check authentication
        // protect middleware should run before this
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Check whether role is allowed
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message:
                    "Access denied. You don't have permission to access this resource."
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

// EXPORT MIDDLEWARE
module.exports = authorizeRoles;