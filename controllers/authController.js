// AUTHENTICATION CONTROLLER - Handles user registration, login, and OAuth authentication
// This controller manages user authentication for the restaurant ordering system

const { User } = require('../config/database');
const { Op } = require('sequelize'); // Sequelize operators for database queries
const { generateToken, validateRequiredFields, isValidPassword } = require('../utils/auth');
const { sendSuccess, sendError, sendServerError, sendValidationError, sendUnauthorized } = require('../utils/responses');
const { verifyGoogleToken, verifyFacebookToken, transformOAuthUser } = require('../utils/oauth');

// REGISTER NEW USER - Creates account with email/password
const signup = async (req, res) => {
  try {
    // Extract user data from request body
    const { email, password, firstName, lastName, phone, address } = req.body;
    const requiredFields = ['email', 'password', 'firstName', 'lastName', 'phone', 'address'];
    
    // Validate all required fields are present
    const validation = validateRequiredFields(req.body, requiredFields);
    if (!validation.isValid) {
      return sendValidationError(res, validation.missing);
    }

    // Validate password strength (minimum 6 characters)
    if (!isValidPassword(password)) {
      return sendError(res, 'Password must be at least 6 characters long');
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return sendError(res, 'User with this email already exists');
    }

    // Create new user (password will be automatically hashed by User model hooks)
    const user = await User.create({
      email, password, firstName, lastName, phone, address
    });

    // Generate JWT token for immediate login
    const token = generateToken(user.id);
    
    // Send success response with user data and token
    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      isAdmin: user.isAdmin,
      token
    }, 201);

  } catch (error) {
    sendServerError(res, error, 'Server error during registration');
  }
};

// USER LOGIN - Authenticates existing users with email/password
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return sendError(res, 'Email and password are required');
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return sendUnauthorized(res); // Don't reveal if email exists for security
    }

    // Verify password using bcrypt comparison
    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return sendUnauthorized(res); // Invalid password
    }

    // Generate JWT token for authenticated session
    const token = generateToken(user.id);
    
    // Return user data and token
    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      isAdmin: user.isAdmin,
      token
    });

  } catch (error) {
    sendServerError(res, error, 'Server error during login');
  }
};

// OAUTH AUTHENTICATION HANDLER - Processes Google and Facebook login
const handleOAuth = async (provider, token, res) => {
  try {
    let userData;
    
    // Verify token with appropriate OAuth provider
    switch (provider) {
      case 'google':
        userData = await verifyGoogleToken(token); // Verify with Google's API
        break;
      case 'facebook':
        userData = await verifyFacebookToken(token); // Verify with Facebook's API
        break;
      default:
        return sendError(res, `Unsupported OAuth provider: ${provider}`);
    }

    // Email is required for account creation
    if (!userData.email) {
      return sendError(res, `Email not provided by ${provider}`);
    }

    // Transform OAuth data to our user format
    const transformedUser = transformOAuthUser(provider, userData);
    
    // Check if user exists
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { email: transformedUser.email },
          { 
            thirdPartyId: transformedUser.thirdPartyId, 
            thirdPartyProvider: transformedUser.thirdPartyProvider 
          }
        ]
      }
    });
    
    if (user) {
      // Update third party info if needed
      if (!user.thirdPartyId) {
        await user.update({
          thirdPartyId: transformedUser.thirdPartyId,
          thirdPartyProvider: transformedUser.thirdPartyProvider
        });
      }
    } else {
      // Check if we have enough info to create user
      if (!transformedUser.firstName || !transformedUser.lastName) {
        return sendSuccess(res, {
          requiresProfile: true,
          tempUserData: transformedUser
        });
      }

      // Create new user with placeholder contact info
      user = await User.create({
        ...transformedUser,
        phone: '',
        address: ''
      });

      return sendSuccess(res, {
        requiresProfile: true,
        userId: user.id,
        message: 'Please complete your profile'
      });
    }
    
    // Check if user has complete profile
    if (!user.phone || !user.address) {
      return sendSuccess(res, {
        requiresProfile: true,
        userId: user.id,
        userData: user.toSafeObject(),
        message: 'Please complete your profile'
      });
    }
    
    const jwtToken = generateToken(user.id);
    sendSuccess(res, { 
      ...user.toSafeObject(), 
      token: jwtToken 
    });

  } catch (error) {
    sendServerError(res, error, `${provider} authentication failed`);
  }
};

// Google OAuth
const googleAuth = (req, res) => {
  const { token } = req.body;
  if (!token) {
    return sendError(res, 'Google token is required');
  }
  return handleOAuth('google', token, res);
};

// Facebook OAuth
const facebookAuth = (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return sendError(res, 'Facebook access token is required');
  }
  return handleOAuth('facebook', accessToken, res);
};

// Complete OAuth profile
const completeOAuthProfile = async (req, res) => {
  try {
    const { userId, firstName, lastName, phone, address, tempUserData } = req.body;
    let user;

    if (userId) {
      // Completing profile for existing user
      user = await User.findByPk(userId);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        phone: phone || user.phone,
        address: address || user.address
      });
    } else if (tempUserData) {
      // Creating new user from OAuth temp data
      const requiredFields = ['firstName', 'lastName', 'phone', 'address'];
      const validation = validateRequiredFields(req.body, requiredFields);
      
      if (!validation.isValid) {
        return sendValidationError(res, validation.missing);
      }

      user = await User.create({
        email: tempUserData.email,
        firstName,
        lastName,
        phone,
        address,
        thirdPartyId: tempUserData.thirdPartyId,
        thirdPartyProvider: tempUserData.thirdPartyProvider
      });
    } else {
      return sendError(res, 'Either userId or tempUserData is required');
    }

    const token = generateToken(user.id);
    sendSuccess(res, {
      ...user.toSafeObject(),
      token,
      message: 'Profile completed successfully'
    });

  } catch (error) {
    sendServerError(res, error, 'Failed to complete profile');
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user.id);
    
    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      isAdmin: user.isAdmin,
      token
    });
  } catch (error) {
    sendServerError(res, error, 'Failed to refresh token');
  }
};

// Logout
const logout = async (req, res) => {
  try {
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    sendServerError(res, error, 'Logout failed');
  }
};

module.exports = {
  signup,
  signin,
  googleAuth,
  facebookAuth,
  completeOAuthProfile,
  refreshToken,
  logout
};