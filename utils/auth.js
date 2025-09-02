const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Validate required fields
const validateRequiredFields = (fields, requiredFields) => {
  const missing = requiredFields.filter(field => !fields[field]);
  return {
    isValid: missing.length === 0,
    missing
  };
};

module.exports = {
  generateToken,
  isValidEmail,
  isValidPassword,
  validateRequiredFields
};