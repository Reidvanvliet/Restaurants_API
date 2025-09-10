// PUBLIC RESTAURANT INFO ROUTES - Public endpoints for restaurant information
// These routes provide restaurant details without requiring authentication

/**
 * @swagger
 * /api/restaurant/info:
 *   get:
 *     tags:
 *       - Restaurant Info
 *     summary: Get current restaurant info
 *     description: Get public restaurant information (id, name, logo, themeColors, phone, email, address, social, hours)
 *     parameters:
 *       - in: query
 *         name: restaurant
 *         schema:
 *           type: string
 *         description: Restaurant identifier (slug or domain)
 *         example: "smokeshack"
 *     responses:
 *       200:
 *         description: Restaurant information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Smoke Shack"
 *                 logo:
 *                   type: string
 *                   example: "https://example.com/logo.png"
 *                 themeColors:
 *                   type: object
 *                   properties:
 *                     primary:
 *                       type: string
 *                       example: "#d97706"
 *                     secondary:
 *                       type: string
 *                       example: "#92400e"
 *                     accent:
 *                       type: string
 *                       example: "#fbbf24"
 *                     background:
 *                       type: string
 *                       example: "#ffffff"
 *                     text:
 *                       type: string
 *                       example: "#1f2937"
 *                 phone:
 *                   type: string
 *                   example: "555-0123"
 *                 email:
 *                   type: string
 *                   example: "info@smokeshack.com"
 *                 address:
 *                   type: string
 *                   example: "123 Main St, City, State"
 *                 social:
 *                   type: object
 *                   example: {"facebook": "smokeshack", "instagram": "@smokeshack"}
 *                 hours:
 *                   type: string
 *                   example: "Mon-Sun 11:00-22:00"
 *       400:
 *         description: Restaurant parameter required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Restaurant parameter is required"
 *       404:
 *         description: Restaurant not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Restaurant not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch restaurant information"
 */

const express = require('express');
const { restaurantContext, requireRestaurantContext } = require('../middleware/restaurantContext');
const router = express.Router();

// @route   GET /api/restaurant/info
// @desc    Get current restaurant info (id, name, logo, themeColors, phone, email, address, social, hours)
// @access  Public (requires restaurant context)
router.get('/info', restaurantContext, requireRestaurantContext, (req, res) => {
  try {
    const { id, name, logo, themeColors, phone, email, address, social, hours } = req.restaurant;
    
    res.json({
      id,
      name,
      logo,
      themeColors,
      phone,
      email,
      address,
      social,
      hours
    });
  } catch (error) {
    console.error('Get restaurant info error:', error);
    res.status(500).json({ message: 'Failed to fetch restaurant information' });
  }
});

module.exports = router;