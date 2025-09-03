// SWAGGER CONFIGURATION - API Documentation Setup
// This file configures Swagger/OpenAPI documentation for the multi-tenant restaurant API

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-Tenant Restaurant API',
      version: '1.0.0',
      description: `
        A comprehensive multi-tenant restaurant management API that supports multiple restaurants through subdomain-based identification.
        
        ## Features
        - **Multi-tenant architecture** with subdomain-based restaurant identification
        - **Role-based access control** (User, Restaurant Admin, Super Admin)
        - **Complete data isolation** between restaurants
        - **Restaurant-scoped operations** for menus, orders, and management
        - **OAuth authentication** support (Google, Facebook)
        - **Image upload** capabilities for menu items
        
        ## Authentication
        The API uses JWT tokens with restaurant context for authentication. Users must access the API through restaurant-specific subdomains.
        
        ## Restaurant Context
        All operations require proper restaurant context via subdomain:
        - \`goldchopsticks.yourapi.com\` - Access Gold Chopsticks restaurant
        - \`pizzapalace.yourapi.com\` - Access Pizza Palace restaurant
        - Custom domains are also supported
        
        ## User Roles
        - **User**: Can view menus, place orders, view own order history
        - **Restaurant Admin**: Can manage their restaurant's menu, orders, and settings
        - **Super Admin**: Can manage all restaurants and platform-wide settings
      `,
      contact: {
        name: 'API Support',
        email: 'support@yourapi.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://restaurants-api-d19o.onrender.com',
        description: 'Platform Admin (Production)'
      },
      {
        url: 'http://localhost:5000',
        description: 'Platform Admin (Development)'
      },
      {
        url: 'http://goldchopsticks.localhost:5000',
        description: 'Gold Chopsticks Restaurant (Development)'
      },
      {
        url: 'http://pizzapalace.localhost:5000',
        description: 'Pizza Palace Restaurant (Development)'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        }
      },
      schemas: {
        // Restaurant Schema
        Restaurant: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique restaurant identifier'
            },
            name: {
              type: 'string',
              description: 'Restaurant name',
              example: 'Gold Chopsticks'
            },
            slug: {
              type: 'string',
              description: 'URL-friendly restaurant identifier',
              example: 'goldchopsticks'
            },
            domain: {
              type: 'string',
              description: 'Custom domain (optional)',
              example: 'goldchopsticks.com'
            },
            logo: {
              type: 'string',
              description: 'URL to restaurant logo image'
            },
            themeColors: {
              type: 'object',
              properties: {
                primary: { type: 'string', example: '#d97706' },
                secondary: { type: 'string', example: '#92400e' },
                accent: { type: 'string', example: '#fbbf24' },
                background: { type: 'string', example: '#ffffff' },
                text: { type: 'string', example: '#1f2937' }
              }
            },
            contactInfo: {
              type: 'object',
              properties: {
                phone: { type: 'string', example: '555-0123' },
                email: { type: 'string', example: 'info@goldchopsticks.com' },
                address: { type: 'string', example: '123 Main St, City, State' },
                hours: { type: 'string', example: 'Mon-Sun 11:00-22:00' },
                socialMedia: { type: 'object' }
              }
            },
            isActive: {
              type: 'boolean',
              description: 'Whether restaurant is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        // User Schema
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            address: {
              type: 'string',
              description: 'User address'
            },
            isAdmin: {
              type: 'boolean',
              description: 'Legacy admin flag (use role instead)'
            },
            role: {
              type: 'string',
              enum: ['user', 'restaurant_admin', 'super_admin'],
              description: 'User role for access control'
            },
            restaurantId: {
              type: 'integer',
              description: 'ID of restaurant user belongs to'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        // Menu Category Schema
        MenuCategory: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique category identifier'
            },
            restaurantId: {
              type: 'integer',
              description: 'Restaurant this category belongs to'
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'Appetizers'
            },
            displayOrder: {
              type: 'integer',
              description: 'Order for displaying categories',
              example: 1
            },
            isActive: {
              type: 'boolean',
              description: 'Whether category is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        // Menu Item Schema
        MenuItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique menu item identifier'
            },
            restaurantId: {
              type: 'integer',
              description: 'Restaurant this item belongs to'
            },
            categoryId: {
              type: 'integer',
              description: 'Category this item belongs to'
            },
            name: {
              type: 'string',
              description: 'Menu item name',
              example: 'General Tso Chicken'
            },
            description: {
              type: 'string',
              description: 'Item description',
              example: 'Sweet and spicy chicken dish'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Item price',
              example: 16.99
            },
            imageUrl: {
              type: 'string',
              description: 'URL to item image'
            },
            isSpicy: {
              type: 'boolean',
              description: 'Whether item is spicy'
            },
            isAvailable: {
              type: 'boolean',
              description: 'Whether item is available for ordering'
            },
            displayOrder: {
              type: 'integer',
              description: 'Order for displaying items'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        // Order Schema
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique order identifier'
            },
            restaurantId: {
              type: 'integer',
              description: 'Restaurant this order belongs to'
            },
            userId: {
              type: 'integer',
              description: 'User who placed the order (null for guest orders)'
            },
            orderNumber: {
              type: 'string',
              description: 'Human-readable order number'
            },
            customerEmail: {
              type: 'string',
              format: 'email',
              description: 'Customer email'
            },
            customerFirstName: {
              type: 'string',
              description: 'Customer first name'
            },
            customerLastName: {
              type: 'string',
              description: 'Customer last name'
            },
            customerPhone: {
              type: 'string',
              description: 'Customer phone number'
            },
            customerAddress: {
              type: 'string',
              description: 'Customer address (for delivery orders)'
            },
            orderType: {
              type: 'string',
              enum: ['pickup', 'delivery'],
              description: 'Order type'
            },
            paymentMethod: {
              type: 'string',
              enum: ['card', 'card_on_arrival', 'cash_on_arrival'],
              description: 'Payment method'
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'failed', 'refunded'],
              description: 'Payment status'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
              description: 'Order status'
            },
            subtotal: {
              type: 'number',
              format: 'decimal',
              description: 'Order subtotal'
            },
            tax: {
              type: 'number',
              format: 'decimal',
              description: 'Tax amount'
            },
            deliveryFee: {
              type: 'number',
              format: 'decimal',
              description: 'Delivery fee (if applicable)'
            },
            total: {
              type: 'number',
              format: 'decimal',
              description: 'Order total'
            },
            notes: {
              type: 'string',
              description: 'Special instructions'
            },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
              description: 'Order items'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        // Order Item Schema
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique order item identifier'
            },
            orderId: {
              type: 'integer',
              description: 'Order this item belongs to'
            },
            menuItemId: {
              type: 'integer',
              description: 'Menu item ID (null for combo items)'
            },
            quantity: {
              type: 'integer',
              description: 'Quantity ordered'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Price per item at time of order'
            },
            itemName: {
              type: 'string',
              description: 'Item name (or JSON for combo items)'
            }
          }
        },
        
        // Error Response Schema
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code (optional)'
            },
            errors: {
              type: 'array',
              items: { type: 'string' },
              description: 'Validation errors (optional)'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management'
      },
      {
        name: 'Menu',
        description: 'Restaurant menu management and viewing'
      },
      {
        name: 'Orders',
        description: 'Order placement and management'
      },
      {
        name: 'Restaurants',
        description: 'Restaurant management (admin only)'
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };