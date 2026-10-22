const PaymentSettings = require('../models/PaymentSettings');

// ================================
// Get Payment Settings (Public - user bhi dekhe)
// ================================
const getPaymentSettings = async (req, res) => {
    try {
        let settings = await PaymentSettings.findOne();
        
        // Agar pehli baar hai, default settings create karein
        if (!settings) {
            settings = new PaymentSettings();
            await settings.save();
        }
        
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================================
// Update Payment Settings (Admin only)
// ================================
const updatePaymentSettings = async (req, res) => {
    try {
        const { wallets, bank } = req.body;
        
        let settings = await PaymentSettings.findOne();
        if (!settings) {
            settings = new PaymentSettings();
        }
        
        if (wallets) settings.wallets = { ...settings.wallets, ...wallets };
        if (bank) settings.bank = { ...settings.bank, ...bank };
        settings.lastUpdated = new Date();
        
        await settings.save();
        
        res.json({ 
            message: 'Payment settings updated successfully!', 
            settings 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getPaymentSettings, updatePaymentSettings };