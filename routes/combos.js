const express = require('express');
const { getComboWithItems, createComboOrder, getAllCombos, resetComboAvailableItems } = require('../controllers/comboController');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/combos
// @desc    Get all combo types
// @access  Public
router.get('/', getAllCombos);

// @route   GET /api/combos/:id
// @desc    Get combo with available items
// @access  Public
router.get('/:id', getComboWithItems);

// @route   POST /api/combos/order
// @desc    Create combo order
// @access  Private
router.post('/order', authMiddleware, createComboOrder);

// @route   POST /api/combos/reset-items
// @desc    Reset combo available items (for debugging)
// @access  Public (remove this in production)
router.post('/reset-items', resetComboAvailableItems);

module.exports = router;