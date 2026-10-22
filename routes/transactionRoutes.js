const express = require('express');
const router = express.Router();
const { 
    createDeposit, 
    createWithdraw, 
    getMyTransactions,
    buyRPPlan,
    getMyMiningPlans,
    sellRPPlan
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/deposit', protect, createDeposit);
router.post('/withdraw', protect, createWithdraw);
router.post('/buy-rp', protect, buyRPPlan);
router.post('/sell-rp', protect, sellRPPlan);
router.get('/my-transactions', protect, getMyTransactions);
router.get('/my-mining', protect, getMyMiningPlans);

module.exports = router;