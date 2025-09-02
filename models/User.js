// USER MODEL - Database schema and business logic for user accounts
// Handles regular users and OAuth users (Google, Facebook) with secure password hashing

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Prevent duplicate email addresses
      validate: {
        isEmail: true // Ensure valid email format
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // Null for OAuth users (Google/Facebook login)
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name' // Maps to snake_case database column
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false // Required for order delivery/pickup contact
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false // Required for delivery orders
    },
    thirdPartyId: {
      type: DataTypes.STRING,
      allowNull: true, // Google/Facebook user ID for OAuth users
      field: 'third_party_id'
    },
    thirdPartyProvider: {
      type: DataTypes.STRING,
      allowNull: true, // 'google' or 'facebook' for OAuth users
      field: 'third_party_provider'
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Regular users are not admins by default
      field: 'is_admin'
    }
  }, {
    tableName: 'users', // Database table name
    underscored: true,  // Use snake_case for auto-generated fields
    timestamps: true,   // Add created_at and updated_at columns
    
    // SEQUELIZE HOOKS - Automatically execute code before/after database operations
    hooks: {
      // Hash password before creating new user (for security)
      beforeCreate: async (user) => {
        if (user.password) { // Only hash if password is provided (skip for OAuth users)
          const bcrypt = require('bcryptjs');
          const salt = await bcrypt.genSalt(10); // Generate random salt for hashing
          user.password = await bcrypt.hash(user.password, salt); // Hash password with salt
        }
      },
      
      // Hash password before updating user (when password is changed)
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          const bcrypt = require('bcryptjs');
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // INSTANCE METHODS - Functions that can be called on individual user objects
  
  // Validate login password against stored hash
  User.prototype.validatePassword = async function(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, this.password); // Compare plain text with hash
  };

  // Return user data without sensitive information (for API responses)
  User.prototype.toSafeObject = function() {
    const { id, email, firstName, lastName, phone, address, isAdmin, createdAt, updatedAt } = this;
    return { id, email, firstName, lastName, phone, address, isAdmin, createdAt, updatedAt };
    // Note: password and thirdPartyId are excluded for security
  };

  return User;
};