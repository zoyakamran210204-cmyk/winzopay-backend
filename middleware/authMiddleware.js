const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ================================
// Protect: Check if user is logged in
// ================================
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token (without password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Block frozen/deactivated users
            if (req.user.status === 'Frozen') {
                return res.status(403).json({ message: 'Your account is Frozen' });
            }
            if (req.user.status === 'Deactivated') {
                return res.status(403).json({ message: 'Your account is Deactivated' });
            }

            next();

        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// ================================
// Admin Only: Check if logged-in user is Admin or SuperAdmin
// ================================
const adminOnly = (req, res, next) => {
    // 🔥 Admin aur SuperAdmin dono allow honge
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'SuperAdmin')) {
        next();
    } else {
        res.status(403).json({ message: 'Admin access only' });
    }
};

module.exports = { protect, adminOnly };