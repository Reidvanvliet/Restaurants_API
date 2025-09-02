const express = require('express');
const { User, Order, MenuItem, MenuCategory, OrderItem } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authMiddleware, adminMiddleware);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get basic counts
    const totalUsers = await User.count();
    const totalOrders = await Order.count();
    const totalMenuItems = await MenuItem.count();
    const activeMenuItems = await MenuItem.count({ where: { isAvailable: true } });

    // Get recent orders
    const recentOrders = await Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          limit: 3 // Show first 3 items
        }
      ]
    });

    // Get orders by status
    const ordersByStatus = await Order.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get revenue data
    const revenueData = await Order.findOne({
      where: {
        createdAt: { [Op.gte]: startDate },
        paymentStatus: 'paid'
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'paidOrders']
      ],
      raw: true
    });

    // Get popular menu items
    const popularItems = await OrderItem.findAll({
      attributes: [
        'itemName',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalOrdered']
      ],
      include: [{
        model: Order,
        as: 'order',
        where: {
          createdAt: { [Op.gte]: startDate }
        },
        attributes: []
      }],
      group: ['itemName'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 5,
      raw: true
    });

    res.json({
      stats: {
        totalUsers,
        totalOrders,
        totalMenuItems,
        activeMenuItems,
        totalRevenue: parseFloat(revenueData?.totalRevenue || 0),
        paidOrders: parseInt(revenueData?.paidOrders || 0)
      },
      recentOrders,
      ordersByStatus,
      popularItems: popularItems.map(item => ({
        name: item.itemName,
        quantity: parseInt(item.totalOrdered)
      }))
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics data
// @access  Private (Admin)
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Revenue over time
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const revenueOverTime = await Order.findAll({
      where: {
        ...where,
        paymentStatus: 'paid'
      },
      attributes: [
        [sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('createdAt')), 'period'],
        [sequelize.fn('SUM', sequelize.col('total')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
      ],
      group: [sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Order type distribution
    const orderTypeDistribution = await Order.findAll({
      where,
      attributes: [
        'orderType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'revenue']
      ],
      group: ['orderType'],
      raw: true
    });

    // Payment method distribution
    const paymentMethodDistribution = await Order.findAll({
      where,
      attributes: [
        'paymentMethod',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'revenue']
      ],
      group: ['paymentMethod'],
      raw: true
    });

    res.json({
      revenueOverTime: revenueOverTime.map(item => ({
        period: item.period,
        revenue: parseFloat(item.revenue || 0),
        orders: parseInt(item.orders || 0)
      })),
      orderTypeDistribution: orderTypeDistribution.map(item => ({
        type: item.orderType,
        count: parseInt(item.count),
        revenue: parseFloat(item.revenue || 0)
      })),
      paymentMethodDistribution: paymentMethodDistribution.map(item => ({
        method: item.paymentMethod,
        count: parseInt(item.count),
        revenue: parseFloat(item.revenue || 0)
      }))
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

module.exports = router;