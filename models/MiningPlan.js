const mongoose = require('mongoose');

const miningPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planName: {
        type: String,
        enum: ['A', 'B', 'C', 'D'],
        required: true
    },
    investmentAmount: { type: Number, required: true },
    profitPercent: { type: Number, required: true }, // 5, 8, 10, 12
    expectedProfit: { type: Number, required: true },
    totalReturn: { type: Number, required: true }, // investmentAmount + expectedProfit
    
    miningCycleSeconds: { type: Number, required: true }, // 120, 300, 500
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, required: true },
    
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Sold'],
        default: 'Active'
    },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MiningPlan', miningPlanSchema);