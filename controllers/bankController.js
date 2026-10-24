const User = require('../models/User');

// Add Bank Account
const addBankAccount = async (req, res) => {
    try {
        const { bankCode, bankName, accountHolderName, accountNumber, agency, cpfCnpj, accountType } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Agar pehla account hai to isDefault true karein
        const isDefault = user.bankAccounts.length === 0;

        user.bankAccounts.push({
            bankCode, bankName, accountHolderName, accountNumber, agency, cpfCnpj, accountType, isDefault
        });

        await user.save();
        res.json({ message: 'Bank account added successfully', bankAccounts: user.bankAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get User's Bank Accounts
const getBankAccounts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ bankAccounts: user.bankAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Bank Account
const updateBankAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { bankCode, bankName, accountHolderName, accountNumber, agency, cpfCnpj, accountType } = req.body;
        
        const user = await User.findById(req.user._id);
        const account = user.bankAccounts.id(accountId);

        if (!account) return res.status(404).json({ message: 'Bank account not found' });

        account.bankCode = bankCode || account.bankCode;
        account.bankName = bankName || account.bankName;
        account.accountHolderName = accountHolderName || account.accountHolderName;
        account.accountNumber = accountNumber || account.accountNumber;
        account.agency = agency || account.agency;
        account.cpfCnpj = cpfCnpj || account.cpfCnpj;
        account.accountType = accountType || account.accountType;

        await user.save();
        res.json({ message: 'Bank account updated', bankAccounts: user.bankAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Bank Account
const deleteBankAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const user = await User.findById(req.user._id);
        
        user.bankAccounts = user.bankAccounts.filter(acc => acc._id.toString() !== accountId);
        await user.save();
        
        res.json({ message: 'Bank account deleted', bankAccounts: user.bankAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Set Default Bank Account
const setDefaultBankAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const user = await User.findById(req.user._id);

        user.bankAccounts.forEach(acc => {
            acc.isDefault = acc._id.toString() === accountId;
        });

        await user.save();
        res.json({ message: 'Default bank account set', bankAccounts: user.bankAccounts });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { addBankAccount, getBankAccounts, updateBankAccount, deleteBankAccount, setDefaultBankAccount };	