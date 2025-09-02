// RESTAURANT CONTEXT MIDDLEWARE - Multi-tenant subdomain detection and context injection
// This middleware automatically detects the restaurant from subdomain/domain and adds it to request context
// Usage: app.use(restaurantContext) - Apply to all routes that need restaurant context

const { Restaurant, sequelize } = require('../config/database');

// Cache restaurants in memory for better performance (refresh every 5 minutes)
let restaurantCache = new Map();
let cacheLastUpdated = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Refresh restaurant cache from database
async function refreshRestaurantCache() {
  try {
    // Check if database connection is available
    if (!sequelize || sequelize.connectionManager.pool._draining) {
      console.log('⚠️ Database connection not available, skipping cache refresh');
      return 0;
    }

    console.log('🔄 Refreshing restaurant cache...');
    const restaurants = await Restaurant.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'slug', 'domain', 'logo', 'themeColors', 'contactInfo']
    });

    // Clear existing cache
    restaurantCache.clear();

    // Add restaurants to cache by both slug and custom domain
    restaurants.forEach(restaurant => {
      // Cache by slug (for subdomain access)
      restaurantCache.set(restaurant.slug, restaurant);
      
      // Cache by custom domain if it exists
      if (restaurant.domain) {
        restaurantCache.set(restaurant.domain, restaurant);
      }
    });

    cacheLastUpdated = Date.now();
    console.log(`✅ Cached ${restaurants.length} restaurants`);
    
    return restaurants.length;
  } catch (error) {
    console.error('❌ Error refreshing restaurant cache:', error.message);
    
    // Don't throw error, just log it and continue with empty cache
    console.log('📝 Continuing with existing cache or empty cache');
    return restaurantCache.size;
  }
}

// Get restaurant from cache or database
async function getRestaurantFromCache(identifier) {
  // Check if cache needs refresh
  if (Date.now() - cacheLastUpdated > CACHE_DURATION || restaurantCache.size === 0) {
    await refreshRestaurantCache();
  }

  // Try to get from cache first
  let restaurant = restaurantCache.get(identifier);
  
  // If not in cache, try database lookup (for new restaurants)
  if (!restaurant) {
    console.log(`🔍 Restaurant '${identifier}' not in cache, checking database...`);
    
    try {
      // Check if database connection is available
      if (!sequelize || sequelize.connectionManager.pool._draining) {
        console.log('⚠️ Database connection not available for restaurant lookup');
        return null;
      }

      const { Op } = require('sequelize');
      restaurant = await Restaurant.findOne({
        where: {
          [Op.or]: [
            { slug: identifier },
            { domain: identifier }
          ],
          isActive: true
        },
        attributes: ['id', 'name', 'slug', 'domain', 'logo', 'themeColors', 'contactInfo']
      });

      // Add to cache if found
      if (restaurant) {
        restaurantCache.set(restaurant.slug, restaurant);
        if (restaurant.domain) {
          restaurantCache.set(restaurant.domain, restaurant);
        }
      }
    } catch (error) {
      console.error(`❌ Database lookup failed for '${identifier}':`, error.message);
    }
  }

  return restaurant;
}

// Extract restaurant identifier from request host
function extractRestaurantIdentifier(host) {
  if (!host) return null;

  // Remove port number if present (e.g., localhost:5000 -> localhost)
  const cleanHost = host.split(':')[0];

  // Handle localhost development scenarios
  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
    return null; // No restaurant context for plain localhost
  }

  // Handle localhost subdomains (e.g., goldchopsticks.localhost)
  if (cleanHost.endsWith('.localhost')) {
    const subdomain = cleanHost.split('.localhost')[0];
    
    // Skip common non-restaurant subdomains
    const systemSubdomains = ['www', 'api', 'admin', 'app', 'dashboard', 'cdn', 'static'];
    if (systemSubdomains.includes(subdomain)) {
      return null;
    }
    
    return subdomain;
  }

  // Get platform domain from environment
  const platformDomain = process.env.PLATFORM_DOMAIN || 'yourapi.com';
  
  // Handle platform domain subdomains (e.g., goldchopsticks.yourapi.com)
  if (cleanHost.endsWith(`.${platformDomain}`)) {
    const subdomain = cleanHost.replace(`.${platformDomain}`, '');
    
    // Skip common non-restaurant subdomains
    const systemSubdomains = ['www', 'api', 'admin', 'app', 'dashboard', 'cdn', 'static'];
    if (systemSubdomains.includes(subdomain)) {
      return null;
    }
    
    return subdomain;
  }

  // Check if it's a custom domain (doesn't match platform domain structure)
  if (!cleanHost.includes(platformDomain) && !cleanHost.includes('localhost')) {
    // This is likely a custom domain - use the full domain as identifier
    return cleanHost;
  }

  return null;
}

// Main restaurant context middleware
const restaurantContext = async (req, res, next) => {
  try {
    // Extract host from request headers
    const host = req.get('host') || req.get('x-forwarded-host');
    
    if (!host) {
      console.warn('⚠️ No host header found in request');
      return next(); // Continue without restaurant context
    }

    // Extract restaurant identifier (subdomain or custom domain)
    const restaurantIdentifier = extractRestaurantIdentifier(host);
    
    if (!restaurantIdentifier) {
      // No restaurant context needed (localhost, www, api, etc.)
      console.log(`🌐 No restaurant context for host: ${host}`);
      return next();
    }

    console.log(`🔍 Looking up restaurant: ${restaurantIdentifier}`);

    // Get restaurant from cache or database
    const restaurant = await getRestaurantFromCache(restaurantIdentifier);

    if (!restaurant) {
      console.log(`❌ Restaurant not found: ${restaurantIdentifier}`);
      return res.status(404).json({
        error: 'Restaurant not found',
        message: `No active restaurant found for: ${restaurantIdentifier}`,
        code: 'RESTAURANT_NOT_FOUND'
      });
    }

    // Add restaurant context to request object
    req.restaurant = restaurant;
    req.restaurantId = restaurant.id;
    req.restaurantSlug = restaurant.slug;

    // Add restaurant info to response headers (optional, for debugging)
    if (process.env.NODE_ENV === 'development') {
      res.set('X-Restaurant-ID', restaurant.id.toString());
      res.set('X-Restaurant-Name', restaurant.name);
      res.set('X-Restaurant-Slug', restaurant.slug);
    }

    console.log(`✅ Restaurant context set: ${restaurant.name} (ID: ${restaurant.id})`);
    next();

  } catch (error) {
    console.error('❌ Restaurant context middleware error:', error);
    
    // Don't fail the request, but log the error
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({
        error: 'Restaurant context error',
        message: error.message,
        code: 'RESTAURANT_CONTEXT_ERROR'
      });
    } else {
      // In production, continue without restaurant context rather than failing
      console.error('Restaurant context middleware failed, continuing without context');
      next();
    }
  }
};

// Middleware that requires restaurant context (fails if no restaurant found)
const requireRestaurantContext = (req, res, next) => {
  if (!req.restaurant || !req.restaurantId) {
    return res.status(400).json({
      error: 'Restaurant context required',
      message: 'This endpoint requires restaurant identification via subdomain or custom domain',
      code: 'RESTAURANT_CONTEXT_REQUIRED',
      examples: [
        'https://goldchopsticks.yourapi.com/api/menu',
        'https://yourrestaurant.com/api/menu'
      ]
    });
  }
  next();
};

// Utility function to manually clear cache (for testing or admin operations)
const clearRestaurantCache = () => {
  restaurantCache.clear();
  cacheLastUpdated = 0;
  console.log('🗑️ Restaurant cache cleared');
};

// Utility function to add restaurant to cache (for new restaurant creation)
const addRestaurantToCache = (restaurant) => {
  if (restaurant && restaurant.slug) {
    restaurantCache.set(restaurant.slug, restaurant);
    if (restaurant.domain) {
      restaurantCache.set(restaurant.domain, restaurant);
    }
    console.log(`➕ Added restaurant to cache: ${restaurant.name}`);
  }
};

// Health check function for restaurant context system
const getRestaurantContextHealth = () => {
  return {
    cacheSize: restaurantCache.size,
    cacheAge: Date.now() - cacheLastUpdated,
    cacheMaxAge: CACHE_DURATION,
    cacheNeedsRefresh: (Date.now() - cacheLastUpdated) > CACHE_DURATION,
    cachedRestaurants: Array.from(restaurantCache.keys())
  };
};

// Initialize cache on startup (with delay to ensure database is ready)
setTimeout(() => {
  refreshRestaurantCache().catch(error => {
    console.error('❌ Failed to initialize restaurant cache:', error.message);
    console.log('⚠️ Restaurant cache will be empty until first request');
  });
}, 1000); // Wait 1 second for database to be ready

module.exports = {
  restaurantContext,
  requireRestaurantContext,
  clearRestaurantCache,
  addRestaurantToCache,
  refreshRestaurantCache,
  getRestaurantContextHealth,
  extractRestaurantIdentifier // Export for testing
};