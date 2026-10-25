const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ================================
// Helper: Get Client IP
// ================================
const getClientIP = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = forwarded.split(',').map(ip => ip.trim());
        return ips[0];
    }
    if (req.headers['cf-connecting-ip']) return req.headers['cf-connecting-ip'];
    if (req.headers['x-real-ip']) return req.headers['x-real-ip'];
    let ip = req.socket.remoteAddress || req.connection.remoteAddress || 'Unknown';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1 (Local)';
    if (ip.startsWith('::ffff:')) ip = ip.substring(7);
    return ip;
};

// ================================
// Register User
// ================================
const registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        if (!name || !mobile || !password) {
            return res.status(400).json({ message: 'Name, mobile, and password are required' });
        }

        let user = await User.findOne({ mobile });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this mobile number' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const ipAddress = getClientIP(req);

        user = new User({
            name, 
            mobile,
            email: email || mobile, // Agar email nahi bheji toh mobile hi email ban jaye
            password: hashedPassword,
            ipAddress: ipAddress,
            country: 'Brazil',
            currency: 'BRL'
        });

        await user.save();

        res.status(201).json({ 
            message: 'User registered successfully',
            userId: user._id
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Login User (Mobile for User, Email for Admin)
// ================================
const loginUser = async (req, res) => {
    try {
        const { email, mobile, password } = req.body;

        if ((!email && !mobile) || !password) {
            return res.status(400).json({ message: 'Credentials and password required' });
        }

        let user;

        // Admin Login (Email se)
        if (email && email.includes('@')) {
            user = await User.findOne({ email });
            if (user && user.role !== 'Admin') {
                return res.status(403).json({ message: 'Access denied. Please use User Panel.' });
            }
        } 
        // User Login (Mobile se)
        else if (mobile) {
            user = await User.findOne({ mobile });
            if (user && user.role === 'Admin') {
                return res.status(403).json({ message: 'Access denied. Please use Admin Panel.' });
            }
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.status === 'Frozen') {
            return res.status(403).json({ message: 'Your account is Frozen. Please contact Admin.' });
        }
        if (user.status === 'Deactivated') {
            return res.status(403).json({ message: 'Your account is Deactivated.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        user.ipAddress = getClientIP(req);
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({ 
            token, 
            user: { 
                _id: user._id,
                id: user._id, 
                name: user.name, 
                email: user.email, 
                mobile: user.mobile,
                role: user.role,
                balance: user.balance,
                miningCapital: user.miningCapital,
                rpBalance: user.rpBalance,
                withdrawableBalance: user.withdrawableBalance,
                currency: user.currency,
                country: user.country,
                status: user.status,
                ipAddress: user.ipAddress,
                bankAccounts: user.bankAccounts || []
            } 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Change Password
// ================================
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Old and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Get Current User Data
// ================================
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { registerUser, loginUser, changePassword, getCurrentUser };