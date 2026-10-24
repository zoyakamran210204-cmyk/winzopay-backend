const Setting = require('../models/Setting');

// Get setting (public)
exports.getSetting = async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: req.params.key });
        if (!setting) {
            // Default return if not found
            return res.json({ value: req.params.key === 'telegram_username' ? 'vickypp' : '' });
        }
        res.json({ value: setting.value });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update setting (admin only)
exports.updateSetting = async (req, res) => {
    try {
        const { value } = req.body;
        let setting = await Setting.findOne({ key: req.params.key });
        
        if (setting) {
            setting.value = value;
            await setting.save();
        } else {
            setting = await Setting.create({ key: req.params.key, value });
        }
        
        res.json({ message: 'Setting updated successfully', setting });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};