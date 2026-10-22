const Transaction = require('../models/Transaction');
const User = require('../models/User');
const MiningPlan = require('../models/MiningPlan');

// ================================
// Create Deposit Request — WITH Transaction ID (Bank only)
// ================================
const createDeposit = async (req, res) => {
    try {
        const { amount, cryptoType, planName, transactionId, paymentProof } = req.body;

        if (!amount || amount < 100) {
            return res.status(400).json({ message: 'Minimum deposit is R$ 100' });
        }

        if (amount > 100000) {
            return res.status(400).json({ message: 'Maximum deposit is R$ 100,000' });
        }

        // ⚠️ Transaction ID SIRF Bank ke liye zaroori hai
        if (cryptoType === 'Bank') {
            if (!transactionId || transactionId.trim().length < 3) {
                return res.status(400).json({ 
                    message: 'Transaction ID / UTR is required for bank transfer (minimum 3 characters)' 
                });
            }
        }

        const ipAddress = 
            req.headers['x-forwarded-for']?.split(',')[0] || 
            req.socket.remoteAddress || 
            'Unknown';

        const transaction = new Transaction({
            userId: req.user._id,
            type: 'Deposit',
            amount,
            currency: 'BRL',
            cryptoType: cryptoType || 'USDT',
            planName: planName || null,
            transactionId: cryptoType === 'Bank' ? transactionId.trim() : null,
            paymentProof: paymentProof || null,
            status: 'Pending',
            ipAddress
        });

        await transaction.save();

        res.status(201).json({
            message: 'Deposit request submitted. Please wait for admin approval.',
            transaction
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Create Withdraw Request
// ================================
const createWithdraw = async (req, res) => {
    try {
        const { 
            amount, 
            cryptoType, 
            bankDetails, 
            pixDetails, 
            cryptoDetails 
        } = req.body;

        if (!amount || amount < 100) {
            return res.status(400).json({ message: 'Minimum withdrawal is R$ 100' });
        }

        if (cryptoType === 'Bank') {
            if (!bankDetails || !bankDetails.bankCode || !bankDetails.accountHolderName || 
                !bankDetails.accountNumber || !bankDetails.cpfCnpj) {
                return res.status(400).json({ 
                    message: 'Complete bank details required (Bank, Holder Name, Account, CPF)' 
                });
            }
        } else if (cryptoType === 'PIX') {
            if (!pixDetails || !pixDetails.pixKeyType || !pixDetails.pixKey || 
                !pixDetails.accountHolderName) {
                return res.status(400).json({ 
                    message: 'Complete PIX details required (Key Type, PIX Key, Name)' 
                });
            }
        } else if (cryptoType === 'USDT') {
            if (!cryptoDetails || !cryptoDetails.network || !cryptoDetails.walletAddress) {
                return res.status(400).json({ 
                    message: 'Complete USDT details required (Network, Wallet Address)' 
                });
            }
        }

        const user = await User.findById(req.user._id);

        if (user.withdrawableBalance < amount) {
            return res.status(400).json({ message: 'Insufficient withdrawable balance' });
        }

        const ipAddress = 
            req.headers['x-forwarded-for']?.split(',')[0] || 
            req.socket.remoteAddress || 
            'Unknown';

        const transaction = new Transaction({
            userId: req.user._id,
            type: 'Withdraw',
            amount,
            currency: 'BRL',
            cryptoType: cryptoType || 'Bank',
            bankDetails: cryptoType === 'Bank' ? bankDetails : {},
            pixDetails: cryptoType === 'PIX' ? pixDetails : {},
            cryptoDetails: cryptoType === 'USDT' ? cryptoDetails : {},
            status: 'Pending',
            ipAddress
        });

        await transaction.save();

        res.status(201).json({
            message: 'Withdraw request submitted. Please wait for admin approval.',
            transaction
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Get User's Own Transactions
// ================================
const getMyTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ================================
// Buy RP Plan
// ================================
const buyRPPlan = async (req, res) => {
    try {
        const { planName, amount } = req.body;

        if (!planName || !amount) {
            return res.status(400).json({ message: 'Plan name and amount are required' });
        }

        const user = await User.findById(req.user._id);

        if (user.balance < amount) {
            return res.status(400).json({ 
                message: `Insufficient balance. You have R$ ${user.balance.toFixed(2)}, need R$ ${amount.toFixed(2)}` 
            });
        }

        const planConfig = {
            'A': { min: 100, max: 500, roi: 5, cycle: 120 },
            'B': { min: 501, max: 1000, roi: 8, cycle: 300 },
            'C': { min: 1001, max: 1500, roi: 10, cycle: 300 },
            'D': { min: 10000, max: 100000, roi: 12, cycle: 500 }
        };

        const config = planConfig[planName];
        if (!config) {
            return res.status(400).json({ message: 'Invalid plan' });
        }

        if (amount < config.min || amount > config.max) {
            return res.status(400).json({ 
                message: `Plan ${planName} range is R$ ${config.min} - R$ ${config.max}` 
            });
        }

        const ipAddress = 
            req.headers['x-forwarded-for']?.split(',')[0] || 
            req.socket.remoteAddress || 
            'Unknown';

        const expectedProfit = (amount * config.roi) / 100;
        const totalReturn = amount + expectedProfit;
        const endTime = new Date(Date.now() + config.cycle * 1000);

        const transaction = new Transaction({
            userId: user._id,
            type: 'PlanPurchase',
            amount,
            currency: 'BRL',
            cryptoType: 'USDT',
            planName,
            status: 'Approved',
            ipAddress
        });
        await transaction.save();

        const miningPlan = new MiningPlan({
            userId: user._id,
            planName,
            investmentAmount: amount,
            profitPercent: config.roi,
            expectedProfit,
            totalReturn,
            miningCycleSeconds: config.cycle,
            startTime: new Date(),
            endTime,
            status: 'Active'
        });
        await miningPlan.save();

        user.balance -= amount;
        user.miningCapital += amount;
        user.rpBalance += amount;
        await user.save();

        res.json({
            message: `Successfully purchased Plan ${planName}! Mining started.`,
            transaction,
            miningPlan,
            user: {
                balance: user.balance,
                miningCapital: user.miningCapital,
                rpBalance: user.rpBalance
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Get User's Mining Plans
// ================================
const getMyMiningPlans = async (req, res) => {
    try {
        const now = new Date();
        await MiningPlan.updateMany(
            { userId: req.user._id, status: 'Active', endTime: { $lte: now } },
            { $set: { status: 'Completed' } }
        );

        const plans = await MiningPlan.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        const active = plans.filter(p => p.status === 'Active');
        const readyToSell = plans.filter(p => p.status === 'Completed');
        const all = plans;

        res.json({
            active,
            readyToSell,
            all,
            stats: {
                activeCount: active.length,
                readyToSellCount: readyToSell.length,
                totalMiningCapital: active.reduce((sum, p) => sum + p.investmentAmount, 0),
                totalMiningProfits: readyToSell.reduce((sum, p) => sum + p.totalReturn, 0)
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Sell Completed RP Plan
// ================================
const sellRPPlan = async (req, res) => {
    try {
        const { miningPlanId } = req.body;

        if (!miningPlanId) {
            return res.status(400).json({ message: 'Mining plan ID is required' });
        }

        const miningPlan = await MiningPlan.findById(miningPlanId);
        if (!miningPlan) {
            return res.status(404).json({ message: 'Mining plan not found' });
        }

        if (miningPlan.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (miningPlan.status === 'Sold') {
            return res.status(400).json({ message: 'This plan is already sold' });
        }

        if (new Date() < miningPlan.endTime) {
            return res.status(400).json({ message: 'Mining cycle not completed yet' });
        }

        const user = await User.findById(req.user._id);

        const ipAddress = 
            req.headers['x-forwarded-for']?.split(',')[0] || 
            req.socket.remoteAddress || 
            'Unknown';

        const transaction = new Transaction({
            userId: user._id,
            type: 'PlanSell',
            amount: miningPlan.totalReturn,
            currency: 'BRL',
            cryptoType: 'USDT',
            planName: miningPlan.planName,
            status: 'Approved',
            ipAddress
        });
        await transaction.save();

        miningPlan.status = 'Sold';
        await miningPlan.save();

        user.miningCapital -= miningPlan.investmentAmount;
        user.rpBalance -= miningPlan.investmentAmount;
        user.withdrawableBalance += miningPlan.totalReturn;
        await user.save();

        res.json({
            message: `Successfully sold RP Plan ${miningPlan.planName}! R$ ${miningPlan.totalReturn.toFixed(2)} added to withdrawable balance.`,
            transaction,
            miningPlan,
            user: {
                miningCapital: user.miningCapital,
                rpBalance: user.rpBalance,
                withdrawableBalance: user.withdrawableBalance
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createDeposit,
    createWithdraw,
    getMyTransactions,
    buyRPPlan,
    getMyMiningPlans,
    sellRPPlan
};