const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ================================
// Get All Users (IP ke sath)
// ================================
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Get Single User Profile (IP visible)
// ================================
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Change User Status (Freeze / Activate / Deactivate)
// ================================
const changeUserStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;

        if (!['Active', 'Frozen', 'Deactivated'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const user = await User.findByIdAndUpdate(
            userId, 
            { status }, 
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ 
            message: `User status changed to ${status}`, 
            user 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Make Another Admin
// ================================
const makeAdmin = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findByIdAndUpdate(
            userId, 
            { role: 'Admin' }, 
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ 
            message: `${user.name} is now an Admin`, 
            user 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Remove Admin (Demote to User)
// ================================
const removeAdmin = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findByIdAndUpdate(
            userId, 
            { role: 'User' }, 
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ 
            message: `${user.name} is now a normal User`, 
            user 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Get All Transactions
// ================================
const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('userId', 'name email mobile ipAddress')
            .sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Approve / Reject Deposit & Withdraw
// ================================
const handleTransaction = async (req, res) => {
    try {
        const { transactionId, action } = req.body;

        if (!['Approved', 'Rejected'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        if (transaction.status !== 'Pending') {
            return res.status(400).json({ message: 'Transaction already processed' });
        }

        transaction.status = action;
        await transaction.save();

        // ====== Business Logic ======

        // Deposit Approved → Add to Top-Up Balance
        if (transaction.type === 'Deposit' && action === 'Approved') {
    const user = await User.findById(transaction.userId);
    
    // Agar plan-specific deposit tha
    if (transaction.planName) {
        // Direct buy plan
        const planConfig = {
            'A': { roi: 5, cycle: 120 },
            'B': { roi: 8, cycle: 300 },
            'C': { roi: 10, cycle: 300 },
            'D': { roi: 12, cycle: 500 }
        };
        
        const config = planConfig[transaction.planName];
        if (config) {
            const expectedProfit = (transaction.amount * config.roi) / 100;
            const totalReturn = transaction.amount + expectedProfit;
            const endTime = new Date(Date.now() + config.cycle * 1000);

            // Create MiningPlan
            const MiningPlan = require('../models/MiningPlan');
            const miningPlan = new MiningPlan({
                userId: user._id,
                planName: transaction.planName,
                investmentAmount: transaction.amount,
                profitPercent: config.roi,
                expectedProfit,
                totalReturn,
                miningCycleSeconds: config.cycle,
                startTime: new Date(),
                endTime,
                status: 'Active'
            });
            await miningPlan.save();

            // Update balances (miningCapital, rpBalance)
            user.miningCapital += transaction.amount;
            user.rpBalance += transaction.amount;
            await user.save();
        }
    } else {
        // Normal top-up
        user.balance += transaction.amount;
        await user.save();
    }
}

        // Withdraw Approved → Deduct from Withdrawable Balance
        if (transaction.type === 'Withdraw' && action === 'Approved') {
            await User.findByIdAndUpdate(transaction.userId, {
                $inc: { withdrawableBalance: -transaction.amount }
            });
        }

        // Plan Purchase Approved
        if (transaction.type === 'PlanPurchase' && action === 'Approved') {
            await User.findByIdAndUpdate(transaction.userId, {
                $inc: { 
                    balance: -transaction.amount,
                    miningCapital: transaction.amount,
                    rpBalance: transaction.amount
                }
            });
        }

        res.json({ 
            message: `Transaction ${action} successfully`, 
            transaction 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Delete Transaction (Permanent)
// ================================
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Safety: Approved transactions cannot be deleted
        if (transaction.status === 'Approved') {
            return res.status(400).json({ 
                message: 'Cannot delete an approved transaction. Reject it first if needed.' 
            });
        }

        await Transaction.findByIdAndDelete(id);

        res.json({ 
            message: 'Transaction deleted successfully',
            deletedId: id 
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// ================================
// Reset User Password (Generate New Temporary Password)
// ================================
const resetUserPassword = async (req, res) => {
    try {
        const { userId } = req.body;
        const bcrypt = require('bcryptjs');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate new random password
        const generatePassword = () => {
            const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
            let pwd = '';
            for (let i = 0; i < 8; i++) {
                pwd += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return pwd + '@' + Math.floor(100 + Math.random() * 900); // Add @XXX
        };

        const newPassword = generatePassword();

        // Hash and save
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({
            message: 'Password reset successfully',
            newPassword: newPassword,  // Return plain password (one-time)
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// EXPORTS — Sabse aakhir mein
// ================================
module.exports = { 
    getAllUsers, 
    getUserById,
    changeUserStatus, 
    makeAdmin, 
    removeAdmin,
    getAllTransactions,
    handleTransaction,
    deleteTransaction,
	resetUserPassword    
};