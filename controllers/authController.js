// AUTHENTICATION CONTROLLER - Handles user registration, login, and OAuth authentication
// This controller manages user authentication for the restaurant ordering system

const { User, Restaurant } = require('../config/database'); // Added Restaurant model
const { Op } = require('sequelize'); // Sequelize operators for database queries
const { generateToken, validateRequiredFields, isValidPassword } = require('../utils/auth');
const { sendSuccess, sendError, sendServerError, sendValidationError, sendUnauthorized } = require('../utils/responses');
const { verifyGoogleToken, verifyFacebookToken, transformOAuthUser } = require('../utils/oauth');
const { requireRestaurantContext } = require('../middleware/restaurantContext'); // Multi-tenant support

// REGISTER NEW USER - Creates account with email/password for specific restaurant
const signup = async (req, res) => {
  try {
    // Restaurant context is required for user registration
    if (!req.restaurant || !req.restaurantId) {
      return sendError(res, 'Restaurant context required for user registration. Please access via restaurant subdomain (e.g., goldchopsticks.yourapi.com)');
    }

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

    // Check if user already exists with this email in ANY restaurant (email should be globally unique)
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      if (existingUser.restaurantId === req.restaurantId) {
        return sendError(res, 'User with this email already exists in this restaurant');
      } else {
        // User exists in different restaurant
        const otherRestaurant = await Restaurant.findByPk(existingUser.restaurantId);
        return sendError(res, `User with this email is already registered with ${otherRestaurant?.name || 'another restaurant'}`);
      }
    }

    // Create new user for current restaurant (password will be automatically hashed by User model hooks)
    const user = await User.create({
      restaurantId: req.restaurantId, // Assign to current restaurant
      email, password, firstName, lastName, phone, address
    });

    // Generate JWT token with restaurant context for immediate login
    const token = generateToken(user.id, req.restaurantId);
    
    // Send success response with user data and token
    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      isAdmin: user.isAdmin,
      restaurantId: user.restaurantId,
      restaurant: {
        id: req.restaurant.id,
        name: req.restaurant.name,
        slug: req.restaurant.slug
      },
      token
    }, 201);

    console.log(`New user registered: ${email} for ${req.restaurant.name}`);

  } catch (error) {
    sendServerError(res, error, 'Server error during registration');
  }
};

// USER LOGIN - Authenticates existing users with email/password for specific restaurant
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return sendError(res, 'Email and password are required');
    }

    // Restaurant context is required for user login
    if (!req.restaurant || !req.restaurantId) {
      return sendError(res, 'Restaurant context required for login. Please access via restaurant subdomain (e.g., goldchopsticks.yourapi.com)');
    }

    // Find user by email and restaurant
    const user = await User.findOne({ 
      where: { 
        email,
        restaurantId: req.restaurantId // User must belong to current restaurant
      },
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'slug']
      }]
    });

    if (!user) {
      // Don't reveal if email exists for security, but log for debugging
      console.log(`Login attempt failed: ${email} not found in ${req.restaurant.name}`);
      return sendUnauthorized(res, 'Invalid email or password');
    }

    // Verify password using bcrypt comparison
    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      console.log(`Login attempt failed: Invalid password for ${email} in ${req.restaurant.name}`);
      return sendUnauthorized(res, 'Invalid email or password');
    }

    // Double-check user belongs to current restaurant (extra security)
    if (user.restaurantId !== req.restaurantId) {
      console.log(`Security warning: User ${email} tried to access ${req.restaurant.name} but belongs to different restaurant`);
      return sendUnauthorized(res, 'Invalid email or password');
    }

    // Generate JWT token with restaurant context for authenticated session
    const token = generateToken(user.id, user.restaurantId);
    
    // Return user data and token
    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      isAdmin: user.isAdmin,
      restaurantId: user.restaurantId,
      restaurant: {
        id: user.restaurant.id,
        name: user.restaurant.name,
        slug: user.restaurant.slug
      },
      token
    });

    console.log(`User login successful: ${email} for ${req.restaurant.name}`);

  } catch (error) {
    sendServerError(res, error, 'Server error during login');
  }
};

// OAUTH AUTHENTICATION HANDLER - Processes Google and Facebook login
const handleOAuth = async (provider, token, res, req) => {
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
    
    // Restaurant context is required for OAuth registration/login
    if (!req.restaurant || !req.restaurantId) {
      return sendError(res, 'Restaurant context required for OAuth authentication. Please access via restaurant subdomain (e.g., goldchopsticks.yourapi.com)');
    }

    // Check if user exists in this restaurant
    let user = await User.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { email: transformedUser.email },
              { 
                thirdPartyId: transformedUser.thirdPartyId, 
                thirdPartyProvider: transformedUser.thirdPartyProvider 
              }
            ]
          },
          { restaurantId: req.restaurantId } // Must belong to current restaurant
        ]
      },
      include: [{
        model: Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'slug']
      }]
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

      // Create new user with placeholder contact info for current restaurant
      user = await User.create({
        ...transformedUser,
        restaurantId: req.restaurantId, // Assign to current restaurant
        phone: '',
        address: ''
      });

      // Include restaurant info for response
      user.restaurant = req.restaurant;

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
    
    const jwtToken = generateToken(user.id, user.restaurantId);
    sendSuccess(res, { 
      ...user.toSafeObject(),
      restaurant: {
        id: user.restaurant.id,
        name: user.restaurant.name,
        slug: user.restaurant.slug
      },
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
  return handleOAuth('google', token, res, req);
};

// Facebook OAuth
const facebookAuth = (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return sendError(res, 'Facebook access token is required');
  }
  return handleOAuth('facebook', accessToken, res, req);
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

    const token = generateToken(user.id, user.restaurantId);
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
    const token = generateToken(user.id, user.restaurantId);
    
    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      isAdmin: user.isAdmin,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurant: user.restaurant ? {
        id: user.restaurant.id,
        name: user.restaurant.name,
        slug: user.restaurant.slug
      } : null,
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