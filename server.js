// MAIN SERVER FILE - Entry point for Gold Chopsticks Restaurant API
// This file sets up the Express server, configures middleware, connects to database,
// and handles graceful shutdown for production deployment

const express = require('express');
require('dotenv').config(); // Load environment variables from .env file

// Import configuration modules
const { configureMiddleware } = require('./config/middleware'); // Security, CORS, body parsing
const { configureRoutes } = require('./config/routes'); // API endpoint routing
const { errorHandler } = require('./utils/errorHandler'); // Global error handling
const { sequelize } = require('./config/database'); // PostgreSQL database connection

const app = express();
const PORT = process.env.PORT || 5000; // Use environment PORT or default to 5000

// STEP 1: Configure middleware (security, CORS, body parsing, static files)
configureMiddleware(app);

// STEP 2: Database connection and authentication
const connectDatabase = async () => {
  try {
    // Test database connection using Sequelize
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (err) {
    console.error('❌ Unable to connect to the database:', err);
    process.exit(1); // Exit if database connection fails (critical for API)
  }
};

// Initialize database connection on server startup
connectDatabase();

// STEP 3: Configure API routes (/api/auth, /api/menu, /api/orders, etc.)
configureRoutes(app);

// STEP 4: Global error handling middleware (catches all unhandled errors)
app.use(errorHandler);

// STEP 5: Start HTTP server and listen on specified port
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
  console.log(`📱 Frontend at ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// PRODUCTION-READY GRACEFUL SHUTDOWN HANDLING
// This ensures proper cleanup when the server is terminated (important for cloud deployments)
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  // Stop accepting new requests, finish existing ones, then close
  server.close(async () => {
    console.log('HTTP server closed.');
    
    try {
      // Close database connections cleanly
      await sequelize.close();
      console.log('Database connection closed.');
      process.exit(0); // Exit successfully
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1); // Exit with error
    }
  });
};

// Listen for termination signals from hosting platforms (Docker, Heroku, Render, etc.)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kubernetes/Docker termination
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C in terminal

// Handle critical application errors that could crash the server
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;