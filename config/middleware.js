// MIDDLEWARE CONFIGURATION - Security, CORS, Body Parsing, and Request Handling
// This file centralizes all Express middleware setup for the restaurant API

const cors = require('cors');    // Cross-Origin Resource Sharing (allows frontend to call API)
const helmet = require('helmet'); // Security headers to protect against common attacks
const morgan = require('morgan'); // HTTP request logging for debugging and monitoring
const express = require('express');

// CORS Configuration - Controls which domains can access the API
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // Allow requests from React frontend
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Allowed request headers
  exposedHeaders: ['Content-Length'] // Headers frontend can read from responses
};

// Security Configuration - Helmet protects against XSS, clickjacking, etc.
const helmetOptions = {
  crossOriginEmbedderPolicy: false, // Disabled for compatibility with external services
  contentSecurityPolicy: {
    directives: {
      "frame-ancestors": ["'self'", "https://accounts.google.com"] // Allow Google OAuth frames
    }
  }
};

// Utility middleware to conditionally skip middleware for specific paths
// Used to skip JSON parsing for image upload endpoints that use multipart/form-data
const unless = (path, middleware) => {
  return (req, res, next) => {
    if (req.path.includes(path)) {
      return next(); // Skip middleware for this path
    } else {
      return middleware(req, res, next); // Apply middleware normally
    }
  };
};

// Special headers required for Google's FedCM (Federated Credential Management) OAuth
const fedCMHeaders = (req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups'); // Allow OAuth popups
  res.header('Cross-Origin-Embedder-Policy', 'credentialless'); // Security for cross-origin requests
  res.header('Permissions-Policy', 'identity-credentials-get=(self)'); // Allow credential requests
  next();
};

// Import restaurant context middleware
const { restaurantContext } = require('../middleware/restaurantContext');

// MAIN MIDDLEWARE CONFIGURATION FUNCTION
// This function is called from server.js to set up all middleware in the correct order
const configureMiddleware = (app) => {
  
  // 1. SECURITY & HEADERS - Must be first to protect all requests
  app.use(helmet(helmetOptions));    // Add security headers to prevent attacks
  app.use(cors(corsOptions));        // Enable cross-origin requests from frontend
  app.use(fedCMHeaders);             // Add Google OAuth compatibility headers
  
  // 2. REQUEST LOGGING - Log all HTTP requests for debugging/monitoring
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  
  // 3. BODY PARSING - Parse incoming request data
  // Skip JSON parsing for image upload paths (they use multipart/form-data instead)
  app.use(unless('/image', express.json({ limit: '10mb' }))); // Parse JSON bodies up to 10MB
  app.use(express.urlencoded({ extended: true })); // Parse form data
  
  // 4. RESTAURANT CONTEXT - Multi-tenant restaurant detection from subdomain/domain
  // This must come after body parsing but before route handlers
  app.use('/api', restaurantContext); // Apply restaurant context to all API routes
  
  // 5. STATIC FILE SERVING
  app.use('/uploads', express.static('uploads')); // Serve uploaded files from /uploads directory
  
  // 6. PRODUCTION SETUP - Serve React frontend files when deployed
  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    // Serve static files from React build directory
    app.use(express.static(path.join(__dirname, '../../client/build')));
  }
};

module.exports = {
  configureMiddleware,
  corsOptions,
  helmetOptions
};