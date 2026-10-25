const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getClientIP = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    if (req.headers['cf-connecting-ip']) return req.headers['cf-connecting-ip'];
    let ip = req.socket.remoteAddress || 'Unknown';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1 (Local)';
    if (ip.startsWith('::ffff:')) ip = ip.substring(7);
    return ip;
};

// User Registration (Sirf Mobile se)
const registerUser = async (req, res) => {
    try {
        const { name, mobile, password } = req.body;

        if (!name || !mobile || !password) {
            return res.status(400).json({ message: 'Name, mobile, and password are required' });
        }

        let user = await User.findOne({ mobile });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this mobile number' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name, 
            mobile,
            email: mobile, // Backend requirement ke liye email field mein mobile save kar diya
            password: hashedPassword,
            ipAddress: getClientIP(req),
            country: 'Brazil',
            currency: 'BRL'
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully', userId: user._id });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login (Strict Checks)
const loginUser = async (req, res) => {
    try {
        // Frontend se 'email' (Admin Panel) ya 'mobile' (User Panel) aayega
        const { email, mobile, password } = req.body; 
        
        if (!password || (!email && !mobile)) {
            return res.status(400).json({ message: 'Credentials and password required' });
        }

        let user;
        let isAdminPortal = false;

        // 1. Agar request "email" ke sath aayi hai (Admin Panel)
        if (email) {
            isAdminPortal = true;
            user = await User.findOne({ email });
            
            // Check: Agar user mila lekin Admin nahi hai, to block karo
            if (user && user.role !== 'Admin') {
                return res.status(403).json({ message: 'Access denied. Only Admins can login with email.' });
            }
        } 
        // 2. Agar request "mobile" ke sath aayi hai (User Panel)
        else if (mobile) {
            user = await User.findOne({ mobile });
            
            // Check: Agar user mila lekin Admin hai, to usko yahan login mat karwao
            if (user && user.role === 'Admin') {
                return res.status(403).json({ message: 'Access denied. Admins must use the Admin Panel.' });
            }
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Status Check
        if (user.status === 'Frozen') return res.status(403).json({ message: 'Your account is Frozen.' });
        if (user.status === 'Deactivated') return res.status(403).json({ message: 'Your account is Deactivated.' });

        // Password Check
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        user.ipAddress = getClientIP(req);
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ 
            token, 
            user: { 
                _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role,
                balance: user.balance, miningCapital: user.miningCapital, rpBalance: user.rpBalance,
                withdrawableBalance: user.withdrawableBalance, currency: user.currency, country: user.country,
                status: user.status, ipAddress: user.ipAddress, bankAccounts: user.bankAccounts || []
            } 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Old and new password required' });
        if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be 6 characters' });

        const user = await User.findById(req.user._id);
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

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