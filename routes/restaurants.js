// RESTAURANT MANAGEMENT ROUTES - CRUD operations for restaurant entities
// These routes handle restaurant creation, updates, and management for multi-tenant system

/**
 * @swagger
 * components:
 *   schemas:
 *     RestaurantRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Restaurant name
 *           example: "Gold Chopsticks"
 *         slug:
 *           type: string
 *           description: URL-friendly identifier (auto-generated if not provided)
 *           example: "goldchopsticks"
 *         domain:
 *           type: string
 *           description: Custom domain (optional)
 *           example: "goldchopsticks.com"
 *         logo:
 *           type: string
 *           description: URL to restaurant logo
 *         themeColors:
 *           type: object
 *           properties:
 *             primary:
 *               type: string
 *               example: "#d97706"
 *             secondary:
 *               type: string
 *               example: "#92400e"
 *             accent:
 *               type: string
 *               example: "#fbbf24"
 *             background:
 *               type: string
 *               example: "#ffffff"
 *             text:
 *               type: string
 *               example: "#1f2937"
 *         contactInfo:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *               example: "555-0123"
 *             email:
 *               type: string
 *               example: "info@goldchopsticks.com"
 *             address:
 *               type: string
 *               example: "123 Main St, City, State"
 *             hours:
 *               type: string
 *               example: "Mon-Sun 11:00-22:00"
 *             social:
 *               type: object
 *         isActive:
 *           type: boolean
 *           description: Whether restaurant is active
 *           default: true
 *     
 *     RestaurantListResponse:
 *       type: object
 *       properties:
 *         restaurants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Restaurant'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             pages:
 *               type: integer
 */

/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     tags:
 *       - Restaurants
 *     summary: Get all restaurants (Super Admin only)
 *     description: Retrieve a paginated list of all restaurants in the system
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, slug, or domain
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Restaurants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantListResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Super admin access required
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
 *   post:
 *     tags:
 *       - Restaurants
 *     summary: Create new restaurant (Super Admin only)
 *     description: Create a new restaurant in the multi-tenant system
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantRequest'
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Validation error or slug/domain already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Super admin access required
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
 * /api/restaurants/{id}:
 *   get:
 *     tags:
 *       - Restaurants
 *     summary: Get restaurant details
 *     description: Get detailed information about a specific restaurant (Restaurant Admin for own restaurant, Super Admin for any)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied to this restaurant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Restaurant not found
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
 *   put:
 *     tags:
 *       - Restaurants
 *     summary: Update restaurant
 *     description: Update restaurant information (Restaurant Admin for own restaurant, Super Admin for any)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantRequest'
 *     responses:
 *       200:
 *         description: Restaurant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Validation error or slug/domain conflicts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied to this restaurant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Restaurant not found
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
 *   delete:
 *     tags:
 *       - Restaurants
 *     summary: Delete/deactivate restaurant (Super Admin only)
 *     description: Delete or deactivate a restaurant (use ?force=true to deactivate instead of delete)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Restaurant ID
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *         description: Force deactivation instead of deletion
 *     responses:
 *       200:
 *         description: Restaurant deleted/deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Cannot delete restaurant with existing data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userCount:
 *                       type: integer
 *                     orderCount:
 *                       type: integer
 *                 suggestion:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Super admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Restaurant not found
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
 * /api/restaurants/context/health:
 *   get:
 *     tags:
 *       - Restaurants
 *     summary: Get restaurant context system health
 *     description: Check the health of the restaurant context caching system (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 restaurantContext:
 *                   type: object
 *                   properties:
 *                     cacheSize:
 *                       type: integer
 *                       description: Number of restaurants in cache
 *                     cacheAge:
 *                       type: integer
 *                       description: Age of cache in milliseconds
 *                     cacheMaxAge:
 *                       type: integer
 *                       description: Maximum cache age
 *                     cacheNeedsRefresh:
 *                       type: boolean
 *                       description: Whether cache needs refresh
 *                     cachedRestaurants:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of cached restaurant identifiers
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
 * /api/restaurants/context/refresh:
 *   post:
 *     tags:
 *       - Restaurants
 *     summary: Refresh restaurant cache
 *     description: Manually refresh the restaurant context cache (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cache refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Restaurant cache refreshed successfully"
 *                 restaurantCount:
 *                   type: integer
 *                   description: Number of restaurants loaded into cache
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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

const express = require('express');
const { Restaurant, User, MenuItem, Order, sequelize } = require('../config/database'); // Added sequelize import
const { authMiddleware, adminMiddleware, superAdminMiddleware, restaurantAdminMiddleware } = require('../middleware/auth');
const { addRestaurantToCache, clearRestaurantCache, getRestaurantContextHealth, restaurantContext, requireRestaurantContext } = require('../middleware/restaurantContext');
const { Op } = require('sequelize');
const router = express.Router();

// @route   GET /api/restaurants
// @desc    Get all restaurants (super admin only)
// @access  Private (Super Admin)
router.get('/', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, active } = req.query;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
        { domain: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: restaurants, count: total } = await Restaurant.findAndCountAll({
      where,
      order: [['created_at', 'DESC']], // Use snake_case column name
      limit: parseInt(limit),
      offset: offset,
      include: [
        {
          model: User,
          as: 'users',
          attributes: [],
          required: false
        },
        {
          model: MenuItem,
          as: 'menuItems',
          attributes: [],
          required: false
        },
        {
          model: Order,
          as: 'orders',
          attributes: [],
          required: false
        }
      ],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('users.id')), 'userCount'],
          [sequelize.fn('COUNT', sequelize.col('menuItems.id')), 'menuItemCount'],
          [sequelize.fn('COUNT', sequelize.col('orders.id')), 'orderCount']
        ]
      },
      group: ['Restaurant.id'],
      subQuery: false
    });

    res.json({
      restaurants,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ message: 'Failed to fetch restaurants' });
  }
});

// @route   GET /api/restaurants/:id
// @desc    Get single restaurant details
// @access  Private (Restaurant Admin)
router.get('/:id', authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'email', 'firstName', 'lastName', 'isAdmin'],
          limit: 10,
          order: [['created_at', 'DESC']] // Use snake_case column name
        },
        {
          model: MenuItem,
          as: 'menuItems',
          attributes: ['id', 'name', 'price', 'isAvailable'],
          limit: 10,
          order: [['created_at', 'DESC']] // Use snake_case column name
        },
        {
          model: Order,
          as: 'orders',
          attributes: ['id', 'orderNumber', 'total', 'status'],
          limit: 10,
          order: [['created_at', 'DESC']] // Use snake_case column name
        }
      ]
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json(restaurant);

  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ message: 'Failed to fetch restaurant' });
  }
});

// @route   POST /api/restaurants
// @desc    Create new restaurant
// @access  Private (Super Admin)
router.post('/', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const {
      name,
      slug,
      domain,
      logo,
      themeColors,
      contactInfo,
      isActive = true
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ message: 'Restaurant name is required' });
    }

    // Check if slug already exists
    if (slug) {
      const existingSlug = await Restaurant.findOne({ where: { slug } });
      if (existingSlug) {
        return res.status(400).json({ message: 'Slug already exists' });
      }
    }

    // Check if domain already exists
    if (domain) {
      const existingDomain = await Restaurant.findOne({ where: { domain } });
      if (existingDomain) {
        return res.status(400).json({ message: 'Domain already exists' });
      }
    }

    const restaurant = await Restaurant.create({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      domain,
      logo,
      themeColors: themeColors || {
        primary: '#d97706',
        secondary: '#92400e',
        accent: '#fbbf24',
        background: '#ffffff',
        text: '#1f2937'
      },
      contactInfo: contactInfo || {
        phone: null,
        email: null,
        address: null,
        hours: null,
        socialMedia: {}
      },
      isActive
    });

    // Add to cache for immediate availability
    addRestaurantToCache(restaurant);

    console.log(`Created new restaurant: ${restaurant.name} (${restaurant.slug})`);
    res.status(201).json(restaurant);

  } catch (error) {
    console.error('Create restaurant error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors.map(e => e.message) 
      });
    }
    res.status(500).json({ message: 'Failed to create restaurant' });
  }
});

// @route   PUT /api/restaurants/:id
// @desc    Update restaurant
// @access  Private (Restaurant Admin)
router.put('/:id', authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      domain,
      logo,
      themeColors,
      contactInfo,
      isActive
    } = req.body;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check for slug conflicts (excluding current restaurant)
    if (slug && slug !== restaurant.slug) {
      const existingSlug = await Restaurant.findOne({ 
        where: { 
          slug,
          id: { [Op.ne]: id }
        } 
      });
      if (existingSlug) {
        return res.status(400).json({ message: 'Slug already exists' });
      }
    }

    // Check for domain conflicts (excluding current restaurant)
    if (domain && domain !== restaurant.domain) {
      const existingDomain = await Restaurant.findOne({ 
        where: { 
          domain,
          id: { [Op.ne]: id }
        } 
      });
      if (existingDomain) {
        return res.status(400).json({ message: 'Domain already exists' });
      }
    }

    // Update restaurant
    await restaurant.update({
      ...(name && { name }),
      ...(slug && { slug }),
      ...(domain !== undefined && { domain }),
      ...(logo !== undefined && { logo }),
      ...(themeColors && { themeColors }),
      ...(contactInfo && { contactInfo }),
      ...(isActive !== undefined && { isActive })
    });

    // Clear cache to force refresh
    clearRestaurantCache();

    console.log(`Updated restaurant: ${restaurant.name} (ID: ${id})`);
    res.json(restaurant);

  } catch (error) {
    console.error('Update restaurant error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors.map(e => e.message) 
      });
    }
    res.status(500).json({ message: 'Failed to update restaurant' });
  }
});

// @route   DELETE /api/restaurants/:id
// @desc    Delete/deactivate restaurant
// @access  Private (Super Admin)
router.delete('/:id', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if restaurant has data
    const userCount = await User.count({ where: { restaurantId: id } });
    const orderCount = await Order.count({ where: { restaurantId: id } });

    if ((userCount > 0 || orderCount > 0) && !force) {
      return res.status(400).json({
        message: 'Cannot delete restaurant with existing users or orders',
        data: { userCount, orderCount },
        suggestion: 'Use ?force=true to deactivate instead, or transfer data first'
      });
    }

    if (force === 'true') {
      // Deactivate instead of delete
      await restaurant.update({ isActive: false });
      clearRestaurantCache();
      
      console.log(`Deactivated restaurant: ${restaurant.name} (ID: ${id})`);
      res.json({ 
        message: 'Restaurant deactivated successfully',
        restaurant: restaurant 
      });
    } else {
      // Actually delete (only if no data)
      await restaurant.destroy();
      clearRestaurantCache();
      
      console.log(`Deleted restaurant: ${restaurant.name} (ID: ${id})`);
      res.json({ message: 'Restaurant deleted successfully' });
    }

  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ message: 'Failed to delete restaurant' });
  }
});


// @route   GET /api/restaurants/context/health
// @desc    Get restaurant context system health
// @access  Private (Admin)
router.get('/context/health', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const health = getRestaurantContextHealth();
    res.json({
      status: 'OK',
      restaurantContext: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Restaurant context health error:', error);
    res.status(500).json({ message: 'Failed to get health status' });
  }
});

// @route   POST /api/restaurants/context/refresh
// @desc    Manually refresh restaurant cache
// @access  Private (Admin)
router.post('/context/refresh', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    clearRestaurantCache();
    const count = await require('../middleware/restaurantContext').refreshRestaurantCache();
    
    res.json({
      message: 'Restaurant cache refreshed successfully',
      restaurantCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Restaurant cache refresh error:', error);
    res.status(500).json({ message: 'Failed to refresh restaurant cache' });
  }
});

module.exports = router;