const express = require('express');
const { Order, OrderItem, MenuItem, User, ComboType } = require('../config/database');
const { authMiddleware, adminMiddleware, restaurantAdminMiddleware } = require('../middleware/auth');
const { requireRestaurantContext } = require('../middleware/restaurantContext'); // Multi-tenant support
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderRequest:
 *       type: object
 *       required:
 *         - customerEmail
 *         - customerFirstName
 *         - customerLastName
 *         - customerPhone
 *         - orderType
 *         - paymentMethod
 *         - items
 *         - subtotal
 *         - tax
 *         - total
 *       properties:
 *         customerEmail:
 *           type: string
 *           format: email
 *           description: Customer email address
 *         customerFirstName:
 *           type: string
 *           description: Customer first name
 *         customerLastName:
 *           type: string
 *           description: Customer last name
 *         customerPhone:
 *           type: string
 *           description: Customer phone number
 *         customerAddress:
 *           type: string
 *           description: Customer address (required for delivery)
 *         orderType:
 *           type: string
 *           enum: [pickup, delivery]
 *           description: Order type
 *         paymentMethod:
 *           type: string
 *           enum: [card, card_on_arrival, cash_on_arrival]
 *           description: Payment method
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           description: Payment status
 *           default: pending
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               menuItemId:
 *                 type: integer
 *                 description: Menu item ID
 *               quantity:
 *                 type: integer
 *                 description: Quantity
 *               price:
 *                 type: number
 *                 format: decimal
 *                 description: Price per item
 *               itemName:
 *                 type: string
 *                 description: Item name
 *         subtotal:
 *           type: number
 *           format: decimal
 *           description: Order subtotal
 *         tax:
 *           type: number
 *           format: decimal
 *           description: Tax amount
 *         deliveryFee:
 *           type: number
 *           format: decimal
 *           description: Delivery fee
 *           default: 0
 *         total:
 *           type: number
 *           format: decimal
 *           description: Total amount
 *         notes:
 *           type: string
 *           description: Special instructions
 *     
 *     OrderResponse:
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
 *         order:
 *           $ref: '#/components/schemas/Order'
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create new order
 *     description: Create a new order for the current restaurant
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
 *             $ref: '#/components/schemas/OrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderResponse'
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
 * /api/orders/admin/all:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get all orders (Restaurant Admin)
 *     description: Get all orders with filters for the current restaurant (Restaurant Admin only)
 *     parameters:
 *       - in: header
 *         name: Host
 *         required: true
 *         schema:
 *           type: string
 *           example: goldchopsticks.localhost:5000
 *         description: Restaurant subdomain for context
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, completed, cancelled]
 *         description: Filter by order status
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
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// @route   POST /api/orders
// @desc    Create new order for the current restaurant
// @access  Public (requires restaurant context)
router.post('/', requireRestaurantContext, async (req, res) => {
  try {
    const {
      userId,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      customerAddress,
      orderType,
      paymentMethod,
      paymentStatus,
      stripePaymentIntentId,
      items,
      subtotal,
      tax,
      deliveryFee,
      total,
      notes
    } = req.body;

    // Validation
    if (!customerEmail || !customerFirstName || !customerLastName || !customerPhone) {
      return res.status(400).json({ message: 'Customer information is required' });
    }

    if (!orderType || !['pickup', 'delivery'].includes(orderType)) {
      return res.status(400).json({ message: 'Valid order type is required' });
    }

    if (orderType === 'delivery' && !customerAddress) {
      return res.status(400).json({ message: 'Address is required for delivery orders' });
    }

    if (!paymentMethod || !['card', 'card_on_arrival', 'cash_on_arrival'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Valid payment method is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    if (!subtotal || !tax || !total) {
      return res.status(400).json({ message: 'Order totals are required' });
    }

    console.log(`Creating order for restaurant: ${req.restaurant.name} (ID: ${req.restaurantId})`);

    // Validate order items exist and are available for this restaurant
    // Separate combo items from regular menu items
    const regularItems = items.filter(item => !item.isCombo && item.menuItemId);
    const comboItems = items.filter(item => item.isCombo);
    
    // Validate regular menu items belong to current restaurant
    if (regularItems.length > 0) {
      const menuItemIds = regularItems.map(item => item.menuItemId);
      const menuItems = await MenuItem.findAll({
        where: {
          id: menuItemIds,
          isAvailable: true,
          restaurantId: req.restaurantId // Ensure items belong to current restaurant
        }
      });

      if (menuItems.length !== menuItemIds.length) {
        return res.status(400).json({ message: 'Some menu items are not available or do not belong to this restaurant' });
      }
    }
    
    // Validate combo items (check if combo type exists and selected items are available)
    if (comboItems.length > 0) {
      console.log('Debug - Combo items to validate:', JSON.stringify(comboItems, null, 2));
      
      for (const comboItem of comboItems) {
        console.log('Debug - Processing combo item:', JSON.stringify(comboItem, null, 2));
        
        // Check if combo type exists
        const comboType = await ComboType.findByPk(comboItem.comboId);
        if (!comboType) {
          return res.status(400).json({ message: `Combo type ${comboItem.comboId} is not available` });
        }
        
        // Check if selected items in combo are available
        const allSelectedItems = [
          ...(comboItem.selectedItems || []),
          ...(comboItem.additionalItems || []),
          ...(comboItem.baseChoice ? [comboItem.baseChoice] : [])
        ].filter(id => id !== null && id !== undefined); // Filter out null/undefined values
        
        // Get unique item IDs to check availability
        const uniqueSelectedItems = [...new Set(allSelectedItems)];
        
        console.log('Debug - All selected items for validation:', allSelectedItems);
        console.log('Debug - Unique selected items for validation:', uniqueSelectedItems);
        
        if (uniqueSelectedItems.length > 0) {
          const selectedMenuItems = await MenuItem.findAll({
            where: {
              id: uniqueSelectedItems,
              isAvailable: true
            }
          });
          
          console.log('Debug - Found available menu items:', selectedMenuItems.map(item => ({ id: item.id, name: item.name, isAvailable: item.isAvailable })));
          
          // Check if all unique items are available (allows duplicates)
          if (selectedMenuItems.length !== uniqueSelectedItems.length) {
            console.log('Debug - Validation failed - Expected unique items:', uniqueSelectedItems.length, 'Found:', selectedMenuItems.length);
            return res.status(400).json({ 
              message: 'Some combo menu items are not available'
            });
          }
        }
      }
    }

    // Create order for current restaurant
    const order = await Order.create({
      restaurantId: req.restaurantId, // Assign to current restaurant
      userId: userId || null,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      customerAddress: orderType === 'delivery' ? customerAddress : null,
      orderType,
      paymentMethod,
      paymentStatus: paymentStatus || 'pending',
      stripePaymentIntentId: stripePaymentIntentId || null,
      subtotal: parseFloat(subtotal),
      tax: parseFloat(tax),
      deliveryFee: parseFloat(deliveryFee || 0),
      total: parseFloat(total),
      status: 'pending',
      notes: notes || null
    });

    // Create order items
    const orderItems = await Promise.all(
      items.map(async (item) => {
        if (item.isCombo) {
          // Handle combo items - store all combo data in itemName as JSON
          const comboData = {
            type: 'combo',
            comboId: item.comboId,
            selectedItems: item.selectedItems || [],
            additionalItems: item.additionalItems || [],
            baseChoice: item.baseChoice || null,
            originalName: item.itemName
          };
          
          return await OrderItem.create({
            orderId: order.id,
            menuItemId: null, // Combos don't have a single menu item ID
            quantity: item.quantity,
            price: parseFloat(item.price),
            itemName: JSON.stringify(comboData)
          });
        } else {
          // Handle regular menu items
          const menuItem = regularItems.length > 0 ? 
            (await MenuItem.findAll({
              where: {
                id: regularItems.map(ri => ri.menuItemId),
                isAvailable: true
              }
            })).find(mi => mi.id === item.menuItemId) : null;
            
          return await OrderItem.create({
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: parseFloat(item.price),
            itemName: item.itemName || (menuItem ? menuItem.name : item.itemName)
          });
        }
      })
    );

    // Fetch complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: MenuItem,
          as: 'menuItem'
        }]
      }]
    });

    // Send order confirmation email
    try {
      await emailService.sendOrderConfirmation(completeOrder, req.restaurant);
      console.log(`Order confirmation email sent to ${completeOrder.customerEmail}`);
    } catch (emailError) {
      // Log error but don't fail the order creation
      console.error('Failed to send order confirmation email:', emailError);
      // Could optionally add a flag to the order to indicate email failed
    }

    res.status(201).json({
      message: 'Order created successfully',
      restaurant: {
        id: req.restaurant.id,
        name: req.restaurant.name,
        slug: req.restaurant.slug
      },
      order: completeOrder
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// @route   GET /api/orders/user/:userId
// @desc    Get user's order history
// @access  Private (requires restaurant context)
router.get('/user/:userId', requireRestaurantContext, authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(userId);

    // Check if user is accessing their own orders or is admin
    if (req.user.id !== parseInt(userId) && !req.user.isRestaurantAdmin()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify user belongs to current restaurant (security check)
    const targetUser = await User.findOne({
      where: {
        id: userId,
        restaurantId: req.restaurantId
      }
    });
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found in this restaurant' });
    }

    const orders = await Order.findAll({
      where: { 
        userId,
        restaurantId: req.restaurantId // Filter by current restaurant
      },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: MenuItem,
          as: 'menuItem'
        }]
      }],
      order: [['created_at', 'DESC']]
    });

    res.json(orders);

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get specific order
// @access  Private (requires restaurant context)
router.get('/:id', requireRestaurantContext, authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId // Ensure order belongs to current restaurant
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: MenuItem,
            as: 'menuItem'
          }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user can access this order
    if (!req.user.isRestaurantAdmin() && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Restaurant Admin)
router.put('/:id/status', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const order = await Order.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId // Ensure order belongs to current restaurant
      }
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({ status });

    // TODO: Send notification to customer (email, SMS, etc.)
    // await sendOrderStatusNotification(order);

    res.json({ message: 'Order status updated successfully', order });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// @route   GET /api/orders/admin
// @desc    Get all orders with filters (restaurant admin only)
// @access  Private (Restaurant Admin)
router.get('/admin/all', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const {
      status,
      orderType,
      paymentMethod,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause
    const where = {
      restaurantId: req.restaurantId // Filter by current restaurant
    };
    
    if (status) where.status = status;
    if (orderType) where.orderType = orderType;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: orders, count: total } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: MenuItem,
            as: 'menuItem'
          }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      restaurant: {
        id: req.restaurant.id,
        name: req.restaurant.name,
        slug: req.restaurant.slug
      },
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// @route   GET /api/orders/admin/stats
// @desc    Get order statistics (restaurant admin only)
// @access  Private (Restaurant Admin)
router.get('/admin/stats', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      restaurantId: req.restaurantId // Filter by current restaurant
    };
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get basic counts
    const totalOrders = await Order.count({ where });
    const pendingOrders = await Order.count({ 
      where: { ...where, status: 'pending' } 
    });
    const completedOrders = await Order.count({ 
      where: { ...where, status: 'completed' } 
    });

    // Get revenue stats
    const revenueResult = await Order.findOne({
      where: { ...where, paymentStatus: 'paid' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'paidOrders']
      ],
      raw: true
    });

    // Get order type breakdown
    const orderTypeStats = await Order.findAll({
      where,
      attributes: [
        'orderType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['orderType'],
      raw: true
    });

    // Get payment method breakdown
    const paymentMethodStats = await Order.findAll({
      where,
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['paymentMethod'],
      raw: true
    });

    res.json({
      restaurant: {
        id: req.restaurant.id,
        name: req.restaurant.name,
        slug: req.restaurant.slug
      },
      statistics: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: parseFloat(revenueResult?.totalRevenue || 0),
        paidOrders: parseInt(revenueResult?.paidOrders || 0),
        orderTypeBreakdown: orderTypeStats,
        paymentMethodBreakdown: paymentMethodStats
      },
      dateRange: {
        startDate: req.query.startDate || null,
        endDate: req.query.endDate || null
      }
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Failed to fetch order statistics' });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel/Delete order
// @access  Private (Admin or Order Owner)
router.delete('/:id', requireRestaurantContext, authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      where: {
        id: id,
        restaurantId: req.restaurantId // Ensure order belongs to current restaurant
      }
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    if (!req.user.isRestaurantAdmin() && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    // If order was paid, process refund
    if (order.paymentStatus === 'paid' && order.stripePaymentIntentId) {
      // TODO: Process Stripe refund
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // await stripe.refunds.create({
      //   payment_intent: order.stripePaymentIntentId,
      // });
    }

    await order.update({ status: 'cancelled' });

    res.json({ message: 'Order cancelled successfully' });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});

// @route   GET /api/orders/search
// @desc    Search orders by order number or customer info
// @access  Private (Restaurant Admin)
router.get('/admin/search', requireRestaurantContext, authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const orders = await Order.findAll({
      where: {
        restaurantId: req.restaurantId, // Filter by current restaurant
        [Op.or]: [
          { orderNumber: { [Op.iLike]: `%${q}%` } },
          { customerEmail: { [Op.iLike]: `%${q}%` } },
          { customerPhone: { [Op.iLike]: `%${q}%` } },
          { customerFirstName: { [Op.iLike]: `%${q}%` } },
          { customerLastName: { [Op.iLike]: `%${q}%` } }
        ]
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: MenuItem,
            as: 'menuItem'
          }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(orders);

  } catch (error) {
    console.error('Search orders error:', error);
    res.status(500).json({ message: 'Failed to search orders' });
  }
});

module.exports = router;