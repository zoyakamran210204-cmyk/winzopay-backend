const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/adminController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// --- Users Management ---
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/user/:id', protect, adminOnly, getUserById);

// --- User Status Control ---
router.put('/user/status', protect, adminOnly, changeUserStatus);

// --- Reset User Password ---
router.put('/user/reset-password', protect, adminOnly, resetUserPassword);

// --- ⚠️ NAYA: Add Balance ---
router.put('/user/add-balance', protect, adminOnly, addUserBalance);

// --- Admin Role Management ---
router.put('/user/make-admin', protect, adminOnly, makeAdmin);
router.put('/user/remove-admin', protect, adminOnly, removeAdmin);

// --- Transactions ---
router.get('/transactions', protect, adminOnly, getAllTransactions);
router.put('/transaction/action', protect, adminOnly, handleTransaction);
router.delete('/transaction/:id', protect, adminOnly, deleteTransaction);

module.exports = router;