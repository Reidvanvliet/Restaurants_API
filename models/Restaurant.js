// RESTAURANT MODEL - Multi-tenant restaurant entity for the platform
// Each restaurant is a separate tenant with isolated data and configuration

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Restaurant = sequelize.define('Restaurant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255] // Name must be between 1-255 characters
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Used for subdomain identification (e.g., goldchopsticks.yourapi.com)
      validate: {
        is: /^[a-z0-9-]+$/ // Only lowercase letters, numbers, and hyphens
      }
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true, // Optional custom domain (e.g., goldchopsticks.com)
      unique: true,
      validate: {
        isUrl: {
          require_protocol: false,
          require_host: true
        }
      }
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true, // URL to restaurant logo image
      validate: {
        isUrl: true
      }
    },
    themeColors: {
      type: DataTypes.JSON, // Store brand colors and theme customization
      allowNull: true,
      field: 'theme_colors',
      defaultValue: {
        primary: '#d97706',     // Default gold/orange
        secondary: '#92400e',   // Dark orange
        accent: '#fbbf24',      // Light gold
        background: '#ffffff',   // White
        text: '#1f2937'         // Dark gray
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/ // Basic phone number validation
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        streetNumber: null,
        streetName: null,
        unitNumber: null,
        city: null,
        province: null,
        postCode: null
      }
    },
    socialMedia: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'social',
      defaultValue: {
        facebook: null,
        instagram: null,
        X: null
      }
    },
    hours: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // Allow restaurants to be temporarily disabled
      field: 'is_active'
    }
  }, {
    tableName: 'restaurants', // Database table name
    underscored: true,        // Use snake_case for auto-generated fields
    timestamps: true,         // Add created_at and updated_at columns
    
    // Model-level validations
    validate: {
      // Ensure slug is URL-safe for subdomains
      slugFormat() {
        if (this.slug && !/^[a-z0-9-]+$/.test(this.slug)) {
          throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
        }
      }
    },

    // Sequelize hooks for data processing
    hooks: {
      // Automatically generate slug from name if not provided
      beforeValidate: (restaurant) => {
        if (restaurant.name && !restaurant.slug) {
          restaurant.slug = restaurant.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')         // Replace spaces with hyphens
            .replace(/-+/g, '-')          // Replace multiple hyphens with single
            .trim();
        }
      }
    }
  });

  // INSTANCE METHODS - Functions that can be called on individual restaurant objects
  
  // Get restaurant's primary color for branding
  Restaurant.prototype.getPrimaryColor = function() {
    return this.themeColors?.primary || '#d97706';
  };

  // Check if restaurant has custom domain
  Restaurant.prototype.hasCustomDomain = function() {
    return !!this.domain;
  };

  // Get the appropriate URL for this restaurant
  Restaurant.prototype.getUrl = function() {
    if (this.domain) {
      return `https://${this.domain}`;
    }
    return `https://${this.slug}.${process.env.PLATFORM_DOMAIN || 'yourapi.com'}`;
  };

  // Get safe restaurant data for API responses (excludes sensitive info)
  Restaurant.prototype.toSafeObject = function() {
    const { id, name, slug, domain, logo, themeColors, phone, email, address, socialMedia, hours, isActive } = this;
    return { id, name, slug, domain, logo, themeColors, phone, email, address, socialMedia, hours, isActive };
  };

  return Restaurant;
};