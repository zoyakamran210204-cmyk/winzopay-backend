const express = require('express');
const router = express.Router();
const { getSetting, updateSetting } = require('../controllers/settingController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route (kisi bhi user ko telegram username mil sake)
router.get('/:key', getSetting);

// Admin route (sirf admin change kar sake)
router.put('/:key', protect, admin, updateSetting);

module.exports = router;