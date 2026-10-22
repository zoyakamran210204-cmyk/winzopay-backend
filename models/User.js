const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, default: 'Brazil' },
    currency: { type: String, default: 'BRL' },
    balance: { type: Number, default: 0 }, // Top-Up Balance
    miningCapital: { type: Number, default: 0 },
    rpBalance: { type: Number, default: 0 },
    withdrawableBalance: { type: Number, default: 0 },
    ipAddress: { type: String, default: 'Unknown' }, // Admin isko dekhega
    status: { 
        type: String, 
        enum: ['Active', 'Frozen', 'Deactivated'], 
        default: 'Active' 
    },
    role: { 
        type: String, 
        enum: ['User', 'Admin'], 
        default: 'User' 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);