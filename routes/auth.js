const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  signup,
  signin,
  googleAuth,
  facebookAuth,
  completeOAuthProfile,
  refreshToken,
  logout
} = require('../controllers/authController');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', signup);

// @route   POST /api/auth/signin
// @desc    Authenticate user and get token
// @access  Public
router.post('/signin', signin);

// @route   POST /api/auth/google
// @desc    Google OAuth authentication
// @access  Public
router.post('/google', googleAuth);

// @route   POST /api/auth/facebook
// @desc    Facebook OAuth authentication
// @access  Public
router.post('/facebook', facebookAuth);

// @route   POST /api/auth/apple
// @desc    Apple OAuth authentication
// @access  Public
router.post('/apple', async (req, res) => {
  // TODO: Implement Apple OAuth when ready
  res.status(501).json({ message: 'Apple OAuth not yet implemented' });
});

// @route   POST /api/auth/complete-oauth-profile
// @desc    Complete OAuth user profile with missing information
// @access  Public
router.post('/complete-oauth-profile', completeOAuthProfile);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authMiddleware, refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token)
// @access  Private
router.post('/logout', authMiddleware, logout);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  // TODO: Implement password reset functionality
  res.status(501).json({ message: 'Password reset functionality not yet implemented' });
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  // TODO: Implement password reset functionality
  res.status(501).json({ message: 'Password reset functionality not yet implemented' });
});

module.exports = router;