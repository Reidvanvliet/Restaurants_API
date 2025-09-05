const express = require('express');
const { MenuCategory, MenuItem, sequelize } = require('../config/database'); // Added sequelize import
const { authMiddleware, adminMiddleware, restaurantAdminMiddleware } = require('../middleware/auth');
const { requireRestaurantContext } = require('../middleware/restaurantContext'); // Multi-tenant support
const storageService = require('../services/storageService');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MenuResponse:
 *       type: object
 *       properties:
 *         restaurant:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *         menu:
 *           type: object
 *           additionalProperties:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/MenuItem'
 *         itemCount:
 *           type: integer
 *     
 *     CategoriesResponse:
 *       type: object
 *       properties:
 *         restaurant:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MenuCategory'
 *         categoryCount:
 *           type: integer
 *     
 *     MenuItemRequest:
 *       type: object
 *       required:
 *         - categoryId
 *         - name
 *         - price
 *       properties:
 *         categoryId:
 *           type: integer
 *           description: Category ID the item belongs to
 *         name:
 *           type: string
 *           description: Menu item name
 *           example: "General Tso Chicken"
 *         description:
 *           type: string
 *           description: Item description
 *           example: "Sweet and spicy chicken dish"
 *         price:
 *           type: number
 *           format: decimal
 *           description: Item price
 *           example: 16.99
 *         isSpicy:
 *           type: boolean
 *           description: Whether item is spicy
 *           default: false
 *         isAvailable:
 *           type: boolean
 *           description: Whether item is available
 *           default: true
 *         displayOrder:
 *           type: integer
 *           description: Display order
 *           default: 0
 *     
 *     MenuItemResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         restaurant:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *         menuItem:
 *           $ref: '#/components/schemas/MenuItem'
 *     
 *     CategoryRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Category name
 *           example: "Appetizers"
 *         displayOrder:
 *           type: integer
 *           description: Display order
 *           default: 0
 */

/**
 * @swagger
 * /api/menu:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Get restaurant menu
 *     description: Get all available menu items organized by category for the current restaurant
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *     responses:
 *       200:
 *         description: Menu retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuResponse'
 *       400:
 *         description: Restaurant context required
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
 *       - Menu
 *     summary: Create new menu item
 *     description: Create a new menu item for the current restaurant (Restaurant Admin only)
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItemRequest'
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItemResponse'
 *       400:
 *         description: Validation error or invalid category
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
 *         description: Forbidden - Restaurant admin access required
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
 * /api/menu/categories:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Get menu categories
 *     description: Get all active menu categories for the current restaurant
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriesResponse'
 *       400:
 *         description: Restaurant context required
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
 *       - Menu
 *     summary: Create new menu category
 *     description: Create a new menu category for the current restaurant (Restaurant Admin only)
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryRequest'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuCategory'
 *       400:
 *         description: Validation error
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
 *         description: Forbidden - Restaurant admin access required
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
 * /api/menu/{id}:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Get single menu item
 *     description: Get details of a specific menu item from the current restaurant
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Restaurant context required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Menu item not found
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
 *       - Menu
 *     summary: Update menu item
 *     description: Update a menu item belonging to the current restaurant (Restaurant Admin only)
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu item ID
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItemRequest'
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Validation error or restaurant context required
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
 *         description: Forbidden - Restaurant admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Menu item not found or doesn't belong to this restaurant
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
 *       - Menu
 *     summary: Delete menu item
 *     description: Delete a menu item belonging to the current restaurant (Restaurant Admin only)
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu item ID
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Menu item deleted successfully"
 *       400:
 *         description: Restaurant context required
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
 *         description: Forbidden - Restaurant admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Menu item not found or doesn't belong to this restaurant
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

// Configure multer for image uploads
console.log('📋 Loading menu routes...');
console.log('📋 StorageService available:', typeof storageService);
console.log('📋 Getting multer config...');
let upload;
try {
  upload = storageService.getMulterConfig();
  console.log('📋 Multer config loaded successfully');
} catch (error) {
  console.error('❌ Error loading multer config:', error);
  throw error;
}

// Helper function to organize menu items by category
const organizeMenuByCategory = (items) => {
  const organized = {};
  
  items.forEach(item => {
    const categoryKey = item.categoryId;
    if (!organized[categoryKey]) {
      organized[categoryKey] = [];
    }
    organized[categoryKey].push({
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      imageUrl: item.imageUrl,
      isSpicy: item.isSpicy,
      isAvailable: item.isAvailable,
      displayOrder: item.displayOrder
    });
  });

  // Sort items within each category by display order
  Object.keys(organized).forEach(key => {
    organized[key].sort((a, b) => a.displayOrder - b.displayOrder);
  });

  return organized;
};

// @route   GET /api/menu
// @desc    Get all menu items organized by category for the current restaurant
// @access  Public (requires restaurant context via subdomain)
router.get('/', requireRestaurantContext, async (req, res) => {
  try {
    console.log(`GET /api/menu - Fetching menu items for restaurant: ${req.restaurant.name} (ID: ${req.restaurantId})`);
    
    const items = await MenuItem.findAll({
      where: { 
        isAvailable: true,
        restaurantId: req.restaurantId // Filter by current restaurant
      },
      include: [{
        model: MenuCategory,
        as: 'category',
        where: { 
          isActive: true,
          restaurantId: req.restaurantId // Ensure category belongs to same restaurant
        },
        required: false // Changed to false to avoid inner join issues
      }],
      order: [['displayOrder', 'ASC'], ['name', 'ASC']]
    });

    console.log(`Found ${items.length} menu items for ${req.restaurant.name}`);
    
    const organizedMenu = organizeMenuByCategory(items);
    
    res.json({
      restaurant: {
        id: req.restaurant.id,
        name: req.restaurant.name,
        slug: req.restaurant.slug
      },
      menu: organizedMenu,
      itemCount: items.length
    });

  } catch (error) {
    console.error('Get menu error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to fetch menu items', error: error.message });
  }
});

// @route   GET /api/menu/all
// @desc    Get all menu items including unavailable (restaurant admin only)
// @access  Private (Restaurant Admin)
router.get('/all', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const items = await MenuItem.findAll({
      where: {
        restaurantId: req.restaurantId // Filter by current restaurant
      },
      include: [{
        model: MenuCategory,
        as: 'category',
        where: {
          restaurantId: req.restaurantId // Ensure category belongs to same restaurant
        },
        required: false
      }],
      order: [['categoryId', 'ASC'], ['displayOrder', 'ASC'], ['name', 'ASC']]
    });

    const organizedMenu = organizeMenuByCategory(items);
    res.json(organizedMenu);

  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// @route   GET /api/menu/categories
// @desc    Get all menu categories for the current restaurant
// @access  Public (requires restaurant context)
router.get('/categories', requireRestaurantContext, async (req, res) => {
  try {
    const categories = await MenuCategory.findAll({
      where: { 
        isActive: true,
        restaurantId: req.restaurantId // Filter by current restaurant
      },
      order: [['displayOrder', 'ASC']]
    });
    
    console.log(`Found ${categories.length} categories for ${req.restaurant.name}`);
    res.json({
      restaurant: {
        id: req.restaurant.id,
        name: req.restaurant.name,
        slug: req.restaurant.slug
      },
      categories: categories,
      categoryCount: categories.length
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// @route   GET /api/menu/categories/all
// @desc    Get all menu categories including inactive (restaurant admin only)
// @access  Private (Restaurant Admin)
router.get('/categories/all', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const categories = await MenuCategory.findAll({
      where: {
        restaurantId: req.restaurantId // Filter by current restaurant
      },
      order: [['displayOrder', 'ASC']]
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ message: 'Failed to fetch all categories' });
  }
});

// @route   GET /api/menu/category/:categoryId
// @desc    Get menu items by category
// @access  Public (requires restaurant context)
router.get('/category/:categoryId', requireRestaurantContext, async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const items = await MenuItem.findAll({
      where: { 
        categoryId: categoryId,
        isAvailable: true,
        restaurantId: req.restaurantId // Filter by current restaurant
      },
      include: [{
        model: MenuCategory,
        as: 'category',
        where: { 
          isActive: true,
          restaurantId: req.restaurantId // Ensure category belongs to same restaurant
        }
      }],
      order: [['displayOrder', 'ASC'], ['name', 'ASC']]
    });

    res.json(items);
  } catch (error) {
    console.error('Get category items error:', error);
    res.status(500).json({ message: 'Failed to fetch category items' });
  }
});

// @route   GET /api/menu/storage-status
// @desc    Check storage service status
// @access  Private (Admin)
router.get('/storage-status', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const isAvailable = storageService.isAvailable();
    const config = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME,
      keyFile: process.env.GOOGLE_CLOUD_KEY_FILE,
      isAvailable: isAvailable
    };
    
    res.json({
      message: 'Storage service status',
      ...config
    });
  } catch (error) {
    console.error('Storage status error:', error);
    res.status(500).json({ message: 'Failed to get storage status', error: error.message });
  }
});

// @route   GET /api/menu/:id
// @desc    Get single menu item
// @access  Public (requires restaurant context)
router.get('/:id', requireRestaurantContext, async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await MenuItem.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId // Ensure item belongs to current restaurant
      },
      include: [{
        model: MenuCategory,
        as: 'category'
      }]
    });

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ message: 'Failed to fetch menu item' });
  }
});

// @route   POST /api/menu
// @desc    Create new menu item for the current restaurant
// @access  Private (Admin, requires restaurant context)
router.post('/', requireRestaurantContext, authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { categoryId, name, description, price, isSpicy, isAvailable, displayOrder } = req.body;

    // Validation
    if (!categoryId || !name || !price) {
      return res.status(400).json({ message: 'Category, name, and price are required' });
    }

    // Check if category exists and belongs to current restaurant
    const category = await MenuCategory.findOne({
      where: { 
        id: categoryId,
        restaurantId: req.restaurantId // Ensure category belongs to current restaurant
      }
    });
    
    if (!category) {
      return res.status(400).json({ message: 'Invalid category or category does not belong to this restaurant' });
    }

    const item = await MenuItem.create({
      restaurantId: req.restaurantId, // Assign to current restaurant
      categoryId,
      name,
      description,
      price: parseFloat(price),
      isSpicy: isSpicy || false,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      displayOrder: displayOrder || 0
    });

    // Fetch the created item with category info
    const createdItem = await MenuItem.findByPk(item.id, {
      include: [{
        model: MenuCategory,
        as: 'category'
      }]
    });

    console.log(`Created menu item "${name}" for ${req.restaurant.name}`);
    res.status(201).json({
      message: 'Menu item created successfully',
      restaurant: {
        id: req.restaurant.id,
        name: req.restaurant.name,
        slug: req.restaurant.slug
      },
      menuItem: createdItem
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Failed to create menu item' });
  }
});

// @route   PUT /api/menu/:id
// @desc    Update menu item
// @access  Private (Restaurant Admin)
router.put('/:id', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, description, price, isSpicy, isAvailable, displayOrder } = req.body;

    const item = await MenuItem.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId // Ensure item belongs to current restaurant
      }
    });
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found or does not belong to this restaurant' });
    }

    // Update fields
    const updateData = {};
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (isSpicy !== undefined) updateData.isSpicy = isSpicy;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    await item.update(updateData);

    // Fetch updated item with category info
    const updatedItem = await MenuItem.findByPk(id, {
      include: [{
        model: MenuCategory,
        as: 'category'
      }]
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Failed to update menu item' });
  }
});

// @route   DELETE /api/menu/:id
// @desc    Delete menu item
// @access  Private (Restaurant Admin)
router.delete('/:id', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId // Ensure item belongs to current restaurant
      }
    });
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found or does not belong to this restaurant' });
    }

    await item.destroy();
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
});

// @route   POST /api/menu/categories
// @desc    Create new menu category
// @access  Private (Restaurant Admin)
router.post('/categories', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { name, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await MenuCategory.create({
      restaurantId: req.restaurantId, // Assign to current restaurant
      name,
      displayOrder: displayOrder || 0
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// @route   PUT /api/menu/categories/:id
// @desc    Update menu category
// @access  Private (Restaurant Admin)
router.put('/categories/:id', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, displayOrder, isActive } = req.body;

    const category = await MenuCategory.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId // Ensure category belongs to current restaurant
      }
    });
    if (!category) {
      return res.status(404).json({ message: 'Category not found or does not belong to this restaurant' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    await category.update(updateData);
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// @route   DELETE /api/menu/categories/:id
// @desc    Delete menu category
// @access  Private (Restaurant Admin)
router.delete('/categories/:id', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await MenuCategory.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId // Ensure category belongs to current restaurant
      }
    });
    if (!category) {
      return res.status(404).json({ message: 'Category not found or does not belong to this restaurant' });
    }

    // Check if category has menu items (only count items from this restaurant)
    const itemCount = await MenuItem.count({ 
      where: { 
        categoryId: id,
        restaurantId: req.restaurantId
      } 
    });
    if (itemCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category with ${itemCount} menu items. Please move or delete the items first.` 
      });
    }

    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

// @route   POST /api/menu/:id/image
// @desc    Upload image for menu item
// @access  Private (Restaurant Admin)
router.post('/:id/image', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, (req, res, next) => {
  console.log('📤 Image upload request received for item ID:', req.params.id);
  console.log('📤 Storage service available:', storageService.isAvailable());
  
  // Handle multer upload
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
      }
      if (err.message === 'Only image files are allowed') {
        return res.status(400).json({ message: 'Only image files are allowed' });
      }
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Processing image upload for item ID:', id);

    // Check if file was uploaded
    if (!req.file) {
      console.log('❌ No file provided in request');
      return res.status(400).json({ message: 'No image file provided' });
    }
    console.log('📁 File received:', { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype });

    // Check if storage service is available
    if (!storageService.isAvailable()) {
      console.log('❌ Storage service not available');
      return res.status(503).json({ message: 'Image upload service is not available' });
    }
    console.log('☁️ Storage service is available');

    // Find the menu item (ensure it belongs to current restaurant)
    console.log('🔍 Looking for menu item with ID:', id);
    const menuItem = await MenuItem.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId
      }
    });
    if (!menuItem) {
      console.log('❌ Menu item not found with ID:', id);
      return res.status(404).json({ message: 'Menu item not found or does not belong to this restaurant' });
    }
    console.log('✅ Menu item found:', menuItem.name);

    // Delete old image if exists
    if (menuItem.imageUrl) {
      console.log('🗑️ Deleting old image:', menuItem.imageUrl);
      const oldFilename = storageService.extractFilenameFromUrl(menuItem.imageUrl);
      if (oldFilename) {
        try {
          await storageService.deleteImage(oldFilename);
          console.log('✅ Old image deleted successfully');
        } catch (error) {
          console.warn('⚠️ Failed to delete old image:', error.message);
        }
      }
    }

    // Upload new image
    console.log('📤 Starting upload to Google Cloud Storage...');
    const uploadResult = await storageService.uploadImage(req.file, 'menu-items');
    console.log('✅ Upload successful:', uploadResult.url);

    // Update menu item with new image URL
    console.log('💾 Updating menu item with new image URL...');
    await menuItem.update({
      imageUrl: uploadResult.url
    });
    console.log('✅ Menu item updated successfully');

    // Fetch updated item with category info
    const updatedItem = await MenuItem.findByPk(id, {
      include: [{
        model: MenuCategory,
        as: 'category'
      }]
    });

    res.json({
      message: 'Image uploaded successfully',
      menuItem: updatedItem,
      uploadInfo: {
        filename: uploadResult.filename,
        url: uploadResult.url,
        size: uploadResult.size
      }
    });

  } catch (error) {
    console.error('Upload image error:', error);
    console.error('Error stack:', error.stack);
    console.error('Storage service available:', storageService.isAvailable());
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    if (error.message === 'Only image files are allowed') {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }
    
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
});

// @route   DELETE /api/menu/:id/image
// @desc    Delete image for menu item
// @access  Private (Restaurant Admin)
router.delete('/:id/image', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the menu item (ensure it belongs to current restaurant)
    const menuItem = await MenuItem.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId
      }
    });
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found or does not belong to this restaurant' });
    }

    if (!menuItem.imageUrl) {
      return res.status(400).json({ message: 'Menu item has no image to delete' });
    }

    // Extract filename from URL and delete from storage
    if (storageService.isAvailable()) {
      const filename = storageService.extractFilenameFromUrl(menuItem.imageUrl);
      if (filename) {
        try {
          await storageService.deleteImage(filename);
        } catch (error) {
          console.warn('Failed to delete image from storage:', error.message);
        }
      }
    }

    // Remove image URL from database
    await menuItem.update({
      imageUrl: null
    });

    // Fetch updated item with category info
    const updatedItem = await MenuItem.findByPk(id, {
      include: [{
        model: MenuCategory,
        as: 'category'
      }]
    });

    res.json({
      message: 'Image deleted successfully',
      menuItem: updatedItem
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

// @route   PUT /api/menu/:id
// @desc    Update menu item (modified to handle image uploads)
// @access  Private (Restaurant Admin)
router.put('/:id/with-image', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, description, price, isSpicy, isAvailable, displayOrder } = req.body;

    const item = await MenuItem.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId
      }
    });
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found or does not belong to this restaurant' });
    }

    // Handle image upload if provided
    let imageUrl = item.imageUrl; // Keep existing image URL by default
    
    if (req.file && storageService.isAvailable()) {
      // Delete old image if exists
      if (item.imageUrl) {
        const oldFilename = storageService.extractFilenameFromUrl(item.imageUrl);
        if (oldFilename) {
          try {
            await storageService.deleteImage(oldFilename);
          } catch (error) {
            console.warn('Failed to delete old image:', error.message);
          }
        }
      }

      // Upload new image
      const uploadResult = await storageService.uploadImage(req.file, 'menu-items');
      imageUrl = uploadResult.url;
    }

    // Update fields
    const updateData = {};
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (isSpicy !== undefined) updateData.isSpicy = isSpicy;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (imageUrl !== item.imageUrl) updateData.imageUrl = imageUrl;

    await item.update(updateData);

    // Fetch updated item with category info
    const updatedItem = await MenuItem.findByPk(id, {
      include: [{
        model: MenuCategory,
        as: 'category'
      }]
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Update menu item with image error:', error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    if (error.message === 'Only image files are allowed') {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }
    
    res.status(500).json({ message: 'Failed to update menu item' });
  }
});

// @route   POST /api/menu/with-image
// @desc    Create new menu item with image
// @access  Private (Restaurant Admin)
router.post('/with-image', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { categoryId, name, description, price, isSpicy, isAvailable, displayOrder } = req.body;

    // Validation
    if (!categoryId || !name || !price) {
      return res.status(400).json({ message: 'Category, name, and price are required' });
    }

    // Check if category exists and belongs to current restaurant
    const category = await MenuCategory.findOne({
      where: {
        id: categoryId,
        restaurantId: req.restaurantId
      }
    });
    if (!category) {
      return res.status(400).json({ message: 'Invalid category or category does not belong to this restaurant' });
    }

    // Handle image upload if provided
    let imageUrl = null;
    if (req.file && storageService.isAvailable()) {
      const uploadResult = await storageService.uploadImage(req.file, 'menu-items');
      imageUrl = uploadResult.url;
    }

    const item = await MenuItem.create({
      restaurantId: req.restaurantId, // Assign to current restaurant
      categoryId,
      name,
      description,
      price: parseFloat(price),
      isSpicy: isSpicy || false,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      displayOrder: displayOrder || 0,
      imageUrl: imageUrl
    });

    // Fetch the created item with category info
    const createdItem = await MenuItem.findByPk(item.id, {
      include: [{
        model: MenuCategory,
        as: 'category'
      }]
    });

    res.status(201).json(createdItem);
  } catch (error) {
    console.error('Create menu item with image error:', error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    if (error.message === 'Only image files are allowed') {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }
    
    res.status(500).json({ message: 'Failed to create menu item' });
  }
});

module.exports = router;