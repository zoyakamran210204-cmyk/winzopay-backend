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

// Register (User Panel - Sirf Mobile)
const registerUser = async (req, res) => {
    try {
        const { name, mobile, password } = req.body;
        if (!name || !mobile || !password) return res.status(400).json({ message: 'All fields required' });

        let user = await User.findOne({ mobile });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name, mobile, email: mobile, password: hashedPassword,
            ipAddress: getClientIP(req), country: 'Brazil', currency: 'BRL'
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully', userId: user._id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login (Dono ke liye)
const loginUser = async (req, res) => {
    try {
        // Frontend se 'email', 'mobile' ya dono aa sakte hain
        const { email, mobile, password } = req.body; 
        const loginId = email || mobile; // Jo bhi mile use 'loginId' maan lo

        if (!loginId || !password) return res.status(400).json({ message: 'Credentials and password required' });

        // Database mein check karo ke yeh Email hai ya Mobile
        const user = await User.findOne({ 
            $or: [{ email: loginId }, { mobile: loginId }] 
        });

        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Status Check
        if (user.status === 'Frozen') return res.status(403).json({ message: 'Account Frozen' });
        if (user.status === 'Deactivated') return res.status(403).json({ message: 'Account Deactivated' });

        // Password Check
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

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
    // ... (Yeh same rahega jo pehle tha)
};

const getCurrentUser = async (req, res) => {
    // ... (Yeh same rahega jo pehle tha)
};

module.exports = { registerUser, loginUser, changePassword, getCurrentUser };