const express = require('express');
const router = express.Router();
const { getPaymentSettings, updatePaymentSettings } = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public - koi bhi user settings dekh sakta hai
router.get('/', getPaymentSettings);

// Admin only - settings update karne ke liye
router.put('/', protect, adminOnly, updatePaymentSettings);

module.exports = router;