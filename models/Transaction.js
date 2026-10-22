const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['Deposit', 'Withdraw', 'PlanPurchase', 'PlanSell'], 
        required: true 
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'BRL' },
    cryptoType: { 
        type: String, 
        enum: ['BTC', 'BTC(r)', 'USDT', 'ETH', 'Bank', 'PIX'], 
        default: 'USDT' 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    },
    planName: { 
        type: String, 
        default: null 
    },
    
    // ⚠️ NAYA: Transaction ID (user enters after payment)
    transactionId: { 
        type: String, 
        default: null 
    },
    
    // ⚠️ NAYA: Payment Proof
    paymentProof: { 
        type: String, 
        default: null 
    },
    
    // Bank Transfer Details
    bankDetails: {
        bankCode: { type: String, default: null },
        bankName: { type: String, default: null },
        accountHolderName: { type: String, default: null },
        accountNumber: { type: String, default: null },
        cpfCnpj: { type: String, default: null }
    },
    
    // PIX Details
    pixDetails: {
        bankCode: { type: String, default: null },
        bankName: { type: String, default: null },
        pixKeyType: { type: String, default: null },
        pixKey: { type: String, default: null },
        accountHolderName: { type: String, default: null }
    },
    
    // USDT Details
    cryptoDetails: {
        network: { type: String, default: null },
        walletAddress: { type: String, default: null },
        label: { type: String, default: null }
    },
    
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);