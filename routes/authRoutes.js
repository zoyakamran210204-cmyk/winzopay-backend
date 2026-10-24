const express = require('express');
const router = express.Router();
const { registerUser, loginUser, changePassword, getCurrentUser } = require('../controllers/authController');
const { getCryptoRates } = require('../controllers/cryptoController');
const { protect } = require('../middleware/authMiddleware');

// ================================
// Public Routes (No login required)
// ================================
router.post('/register', registerUser);
router.post('/login', loginUser);

// Crypto Rates
router.get('/crypto-rates', async (req, res) => {
    const rates = await getCryptoRates();
    if (rates) {
        res.json(rates);
    } else {
        res.status(500).json({ message: 'Rates not available, try again later' });
    }
});

// Change Password
router.post('/change-password', protect, changePassword);

// ⚠️ NAYA: Get Current User Data
router.get('/me', protect, getCurrentUser);

module.exports = router;