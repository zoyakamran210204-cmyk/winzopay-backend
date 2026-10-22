const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { getCryptoRates } = require('../controllers/cryptoController');

// ================================
// Public Routes (No login required)
// ================================
router.post('/register', registerUser);
router.post('/login', loginUser);

// Crypto Rates (Brazil BRL rates auto-update)
router.get('/crypto-rates', async (req, res) => {
    const rates = await getCryptoRates();
    if (rates) {
        res.json(rates);
    } else {
        res.status(500).json({ message: 'Rates not available, try again later' });
    }
});

module.exports = router;