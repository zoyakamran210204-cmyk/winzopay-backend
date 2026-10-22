const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ================================
// Register User
// ================================
const registerUser = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        // Basic validation
        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        let user = await User.findOne({ $or: [{ email }, { mobile }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this email or mobile' });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Get IP Address (Admin ke liye zaroori)
       // Better IP detection
const getClientIP = (req) => {
    // Check for proxy headers (Cloudflare, Nginx, etc.)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = forwarded.split(',').map(ip => ip.trim());
        return ips[0]; // First IP is the real client
    }
    
    // Cloudflare specific
    if (req.headers['cf-connecting-ip']) {
        return req.headers['cf-connecting-ip'];
    }
    
    // Real IP header
    if (req.headers['x-real-ip']) {
        return req.headers['x-real-ip'];
    }
    
    // Fallback to socket
    let ip = req.socket.remoteAddress || req.connection.remoteAddress || 'Unknown';
    
    // Convert IPv6 localhost to IPv4 for readability
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        return '127.0.0.1 (Local)';
    }
    
    // Remove IPv6 prefix if present
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }
    
    return ip;
};

const ipAddress = getClientIP(req);

        // Create User
        user = new User({
            name,
            email,
            mobile,
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
// Login User
// ================================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check account status
        if (user.status === 'Frozen') {
            return res.status(403).json({ message: 'Your account is Frozen. Please contact Admin.' });
        }
        if (user.status === 'Deactivated') {
            return res.status(403).json({ message: 'Your account is Deactivated.' });
        }

        // Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update IP Address on every login
        user.ipAddress = 
            req.headers['x-forwarded-for']?.split(',')[0] || 
            req.socket.remoteAddress || 
            'Unknown';
        await user.save();

        // Create JWT Token
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
        ipAddress: user.ipAddress
    } 
});

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { registerUser, loginUser };