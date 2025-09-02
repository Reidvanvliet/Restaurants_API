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

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Register a new user account for a specific restaurant. Requires restaurant context via subdomain.
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *           example:
 *             email: "user@goldchopsticks.com"
 *             password: "password123"
 *             firstName: "John"
 *             lastName: "Doe"
 *             phone: "555-0101"
 *             address: "123 Main St, City, State"
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or restaurant context required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate user and get token
 *     description: Login user with email and password. Requires restaurant context via subdomain.
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SigninRequest'
 *           example:
 *             email: "user@goldchopsticks.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials or restaurant context required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Google OAuth authentication
 *     description: Authenticate user with Google OAuth token. Requires restaurant context via subdomain.
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleAuthRequest'
 *           example:
 *             token: "google_oauth_token_here"
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AuthResponse'
 *                 - type: object
 *                   properties:
 *                     requiresProfile:
 *                       type: boolean
 *                       example: true
 *                     userId:
 *                       type: integer
 *                     message:
 *                       type: string
 *                       example: "Please complete your profile"
 *       400:
 *         description: Invalid token or restaurant context required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/facebook:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Facebook OAuth authentication
 *     description: Authenticate user with Facebook access token. Requires restaurant context via subdomain.
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FacebookAuthRequest'
 *           example:
 *             accessToken: "facebook_access_token_here"
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AuthResponse'
 *                 - type: object
 *                   properties:
 *                     requiresProfile:
 *                       type: boolean
 *                       example: true
 *                     userId:
 *                       type: integer
 *                     message:
 *                       type: string
 *                       example: "Please complete your profile"
 *       400:
 *         description: Invalid token or restaurant context required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh JWT token
 *     description: Get a new JWT token using the current valid token
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Logout user (client should discard the token)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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