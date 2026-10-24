const User = require('../models/User');
const Transaction = require('../models/Transaction');
const MiningPlan = require('../models/MiningPlan'); // Mining plan ke liye zaroori

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

        // ⚠️ Deposit Approved → Add to Top-Up Balance ONLY
        if (transaction.type === 'Deposit' && action === 'Approved') {
            const user = await User.findById(transaction.userId);
            
            // Seedha balance add karein (koi plan check nahi)
            user.balance += transaction.amount;
            await user.save();
        }

        // Withdraw Approved → Deduct from Withdrawable Balance
        if (transaction.type === 'Withdraw' && action === 'Approved') {
            await User.findByIdAndUpdate(transaction.userId, {
                $inc: { withdrawableBalance: -transaction.amount }
            });
        }

        // Plan Purchase Approved (agar future mein zaroorat pade)
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
// Reset User Password
// ================================
const resetUserPassword = async (req, res) => {
    try {
        const { userId } = req.body;
        const bcrypt = require('bcryptjs');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const generatePassword = () => {
            const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
            let pwd = '';
            for (let i = 0; i < 8; i++) {
                pwd += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return pwd + '@' + Math.floor(100 + Math.random() * 900);
        };

        const newPassword = generatePassword();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({
            message: 'Password reset successfully',
            newPassword: newPassword,
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
// Add Balance to User (Admin Manual)
// ================================
const addUserBalance = async (req, res) => {
    try {
        const { userId, amount, balanceType } = req.body;

        if (!userId || !amount || !balanceType) {
            return res.status(400).json({ message: 'userId, amount, and balanceType are required' });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (balanceType === 'balance') {
            user.balance += amount;
        } else if (balanceType === 'miningCapital') {
            user.miningCapital += amount;
        } else if (balanceType === 'rpBalance') {
            user.rpBalance += amount;
        } else if (balanceType === 'withdrawableBalance') {
            user.withdrawableBalance += amount;
        } else {
            return res.status(400).json({ message: 'Invalid balanceType' });
        }

        await user.save();

        // Transaction record banayein
        await new Transaction({
            userId: user._id,
            type: 'Deposit',
            amount,
            currency: 'BRL',
            cryptoType: 'Bank',
            status: 'Approved',
            ipAddress: 'Admin Manual Entry'
        }).save();

        res.json({ 
            message: `Successfully added R$ ${amount} to ${balanceType}`,
            user: {
                balance: user.balance,
                miningCapital: user.miningCapital,
                rpBalance: user.rpBalance,
                withdrawableBalance: user.withdrawableBalance
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// EXPORTS
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
    resetUserPassword,
    addUserBalance
};