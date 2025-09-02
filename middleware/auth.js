// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User, Restaurant } = require('../config/database');

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'slug', 'domain']
      }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Verify restaurant context if token contains restaurant ID
    if (decoded.restaurantId && user.restaurantId !== decoded.restaurantId) {
      console.log(`Token restaurant mismatch: token=${decoded.restaurantId}, user=${user.restaurantId}`);
      return res.status(401).json({ message: 'Token restaurant context invalid' });
    }

    req.user = user;
    req.tokenRestaurantId = decoded.restaurantId; // Store token's restaurant context
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin middleware (requires restaurant admin or super admin)
const adminMiddleware = (req, res, next) => {
  if (!req.user.isRestaurantAdmin()) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Super admin middleware (requires super admin only)
const superAdminMiddleware = (req, res, next) => {
  if (!req.user.isSuperAdmin()) {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

// Restaurant admin middleware (requires admin access to specific restaurant)
const restaurantAdminMiddleware = (req, res, next) => {
  // Check if user can manage the restaurant from context or parameter
  const targetRestaurantId = req.restaurantId || req.params.restaurantId;
  
  if (!targetRestaurantId) {
    return res.status(400).json({ message: 'Restaurant context required' });
  }
  
  if (!req.user.canManageRestaurant(parseInt(targetRestaurantId))) {
    return res.status(403).json({ 
      message: 'Access denied. You can only manage your own restaurant.' 
    });
  }
  
  next();
};

// Optional auth middleware (for routes that work with or without auth)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] },
        include: [{
          model: Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'slug', 'domain']
        }]
      });
      
      if (user) {
        // Verify restaurant context if token contains restaurant ID
        if (decoded.restaurantId && user.restaurantId !== decoded.restaurantId) {
          console.log(`Optional auth: Token restaurant mismatch: token=${decoded.restaurantId}, user=${user.restaurantId}`);
        } else {
          req.user = user;
          req.tokenRestaurantId = decoded.restaurantId;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  superAdminMiddleware,
  restaurantAdminMiddleware,
  optionalAuthMiddleware
};