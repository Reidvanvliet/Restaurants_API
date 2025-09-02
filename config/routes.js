// API ROUTE CONFIGURATION - Central routing setup for all API endpoints
// This file organizes and mounts all route modules to their respective paths

const configureRoutes = (app) => {
  
  // MAIN API ROUTES - Each route module handles a specific domain of functionality
  app.use('/api/auth', require('../routes/auth'));         // User authentication (signup/signin/OAuth)
  app.use('/api/menu', require('../routes/menu'));         // Menu items and categories management
  app.use('/api/orders', require('../routes/orders'));     // Order creation and management
  app.use('/api/payments', require('../routes/payments')); // Stripe payment processing
  app.use('/api/admin', require('../routes/admin'));       // Admin-only operations
  app.use('/api/users', require('../routes/users'));       // User profile management
  app.use('/api/google', require('../routes/google'));     // Google Cloud services integration
  app.use('/api/combos', require('../routes/combos'));     // Combo meal management
  app.use('/api/restaurants', require('../routes/restaurants')); // Restaurant management (multi-tenant)

  // SYSTEM HEALTH CHECK - Used by hosting platforms to verify API is running
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Golden Chopsticks API is running!',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // PRODUCTION FRONTEND SERVING - Handle React Router for SPA (Single Page Application)
  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    
    // Catch-all handler for React Router - serves index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        // Serve React app's index.html for client-side routing
        res.sendFile(path.join(__dirname, '../../client/build/index.html'));
      } else {
        // Return 404 for unknown API routes
        res.status(404).json({ message: 'API route not found' });
      }
    });
  }

  // FALLBACK 404 HANDLER - Catches any unmatched routes in development
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
};

module.exports = { configureRoutes };