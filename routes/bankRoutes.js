const express = require('express');
const router = express.Router();
const { addBankAccount, getBankAccounts, updateBankAccount, deleteBankAccount, setDefaultBankAccount } = require('../controllers/bankController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addBankAccount);
router.get('/', protect, getBankAccounts);
router.put('/:accountId', protect, updateBankAccount);
router.delete('/:accountId', protect, deleteBankAccount);
router.put('/:accountId/default', protect, setDefaultBankAccount);

module.exports = router;