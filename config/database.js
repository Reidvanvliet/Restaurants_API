// config/database.js - Enhanced Debug Version
const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔍 Debug: Checking environment variables...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  // Hide password in logs
  const maskedUrl = process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@');
  console.log('DATABASE_URL format:', maskedUrl);
} else {
  console.log('Individual DB variables:');
  console.log('  DB_HOST:', process.env.DB_HOST);
  console.log('  DB_PORT:', process.env.DB_PORT);
  console.log('  DB_NAME:', process.env.DB_NAME);
  console.log('  DB_USER:', process.env.DB_USER);
  console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '****' : 'NOT SET');
}

// Create Sequelize instance with enhanced error handling
let sequelize;

try {
  if (process.env.DATABASE_URL) {
    console.log('🔗 Using DATABASE_URL connection method');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    });
  } else {
    console.log('🔗 Using individual environment variables');
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true,
          createdAt: 'created_at',
          updatedAt: 'updated_at'
        }
      }
    );
  }
  console.log('✅ Sequelize instance created successfully');
} catch (error) {
  console.error('❌ Error creating Sequelize instance:', error);
  process.exit(1);
}

// Import models with error handling
let Restaurant, User, MenuCategory, MenuItem, Order, OrderItem, ComboType, ComboAvailableItems;

try {
  console.log('📦 Loading models...');
  Restaurant = require('../models/Restaurant')(sequelize);
  console.log('✅ Restaurant model loaded');
  
  User = require('../models/User')(sequelize);
  console.log('✅ User model loaded');
  
  MenuCategory = require('../models/MenuCategory')(sequelize);
  console.log('✅ MenuCategory model loaded');
  
  MenuItem = require('../models/MenuItem')(sequelize);
  console.log('✅ MenuItem model loaded');
  
  Order = require('../models/Order')(sequelize);
  console.log('✅ Order model loaded');
  
  OrderItem = require('../models/OrderItem')(sequelize);
  console.log('✅ OrderItem model loaded');
  
  ComboType = require('../models/ComboType')(sequelize);
  console.log('✅ ComboType model loaded');
  
  ComboAvailableItems = require('../models/ComboAvailableItems')(sequelize);
  console.log('✅ ComboAvailableItems model loaded');
} catch (error) {
  console.error('❌ Error loading models:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

// Define associations with error handling
try {
  console.log('🔗 Setting up model associations...');
  
  // RESTAURANT ASSOCIATIONS - Restaurant is the parent of all other entities
  Restaurant.hasMany(User, { foreignKey: 'restaurant_id', as: 'users' });
  User.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });
  
  Restaurant.hasMany(MenuCategory, { foreignKey: 'restaurant_id', as: 'menuCategories' });
  MenuCategory.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });
  
  Restaurant.hasMany(MenuItem, { foreignKey: 'restaurant_id', as: 'menuItems' });
  MenuItem.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });
  
  Restaurant.hasMany(Order, { foreignKey: 'restaurant_id', as: 'orders' });
  Order.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });
  
  Restaurant.hasMany(ComboType, { foreignKey: 'restaurant_id', as: 'comboTypes' });
  ComboType.belongsTo(Restaurant, { foreignKey: 'restaurant_id', as: 'restaurant' });
  
  // EXISTING ASSOCIATIONS - Updated to work within restaurant context
  MenuCategory.hasMany(MenuItem, { foreignKey: 'category_id', as: 'items' });
  MenuItem.belongsTo(MenuCategory, { foreignKey: 'category_id', as: 'category' });
  
  User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
  Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  
  Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
  OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
  
  MenuItem.hasMany(OrderItem, { foreignKey: 'menu_item_id', as: 'orderItems' });
  OrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id', as: 'menuItem' });
  
  // COMBO ASSOCIATIONS - ComboAvailableItems inherits restaurant context through ComboType
  ComboType.hasMany(ComboAvailableItems, { foreignKey: 'combo_type_id', as: 'availableItems' });
  ComboAvailableItems.belongsTo(ComboType, { foreignKey: 'combo_type_id', as: 'comboType' });
  
  MenuItem.hasMany(ComboAvailableItems, { foreignKey: 'menu_item_id', as: 'comboAvailability' });
  ComboAvailableItems.belongsTo(MenuItem, { foreignKey: 'menu_item_id', as: 'menuItem' });
  
  ComboType.hasMany(OrderItem, { foreignKey: 'combo_type_id', as: 'orderItems' });
  OrderItem.belongsTo(ComboType, { foreignKey: 'combo_type_id', as: 'comboType' });
  
  console.log('✅ Model associations set up successfully');
} catch (error) {
  console.error('❌ Error setting up associations:', error);
  console.error('Stack trace:', error.stack);
}

// Enhanced sync database function
const syncDatabase = async () => {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test the connection first with detailed error info
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    console.log('🔄 Syncing database tables...');
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Database synced successfully');
    
    // Seed initial data if needed
    await seedInitialData();
    
  } catch (error) {
    console.error('❌ Database connection/sync error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    // Provide specific troubleshooting based on error type
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 Database connection troubleshooting:');
      console.error('1. Verify your DATABASE_URL is correct');
      console.error('2. Check if your Render database is running');
      console.error('3. Ensure SSL is properly configured');
      console.error('4. Try regenerating your database credentials on Render');
    } else if (error.name === 'SequelizeDatabaseError') {
      console.error('\n💡 Database operation troubleshooting:');
      console.error('1. Check if the database exists');
      console.error('2. Verify user permissions');
      console.error('3. Check for syntax errors in models');
    } else if (error.code) {
      console.error('\n💡 Error code:', error.code);
      if (error.code === 'ECONNRESET') {
        console.error('   - Network connection was reset');
        console.error('   - Try again in a few minutes');
        console.error('   - Check Render service status');
      }
    }
    
    // Don't exit the process in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('\n⚠️  Continuing without database connection...');
    }
  }
};

const seedInitialData = async () => {
  try {
    console.log('🌱 Checking for existing data...');
    
    // Check if categories exist
    const categoryCount = await MenuCategory.count();
    console.log(`📊 Found ${categoryCount} existing categories`);
    
    if (categoryCount === 0) {
      console.log('🌱 Seeding menu categories...');
      
      const categories = [
        { name: 'Appetizers', display_order: 1 },
        { name: 'Soup', display_order: 2 },
        { name: 'Chow Mein', display_order: 3 },
        { name: 'Fried Rice', display_order: 4 },
        { name: 'Chop Suey', display_order: 5 },
        { name: 'Egg Foo Young', display_order: 6 },
        { name: 'Chicken', display_order: 7 },
        { name: 'Beef', display_order: 8 },
        { name: 'Pork', display_order: 9 },
        { name: 'Seafood', display_order: 10 },
        { name: 'Chef Specialty', display_order: 11 },
        { name: 'Combinations', display_order: 12 },
        { name: 'Sauces', display_order: 13 },
        { name: 'Extras', display_order: 14 }
      ];
      
      await MenuCategory.bulkCreate(categories);
      console.log('✅ Menu categories seeded successfully');
    }
    
    // Check menu items
    const itemCount = await MenuItem.count();
    console.log(`📊 Found ${itemCount} existing menu items`);
    
    if (itemCount === 0) {
      console.log('🌱 Seeding sample menu items...');
      
      const sampleItems = [
        { category_id: 1, name: 'Spring Rolls (2pcs)', description: 'Crispy vegetable spring rolls', price: 8.95, is_spicy: false, display_order: 1 },
        { category_id: 1, name: 'Pot Stickers (6pcs)', description: 'Pan-fried pork dumplings', price: 12.95, is_spicy: false, display_order: 2 },
        { category_id: 2, name: 'Hot & Sour Soup', description: 'Traditional spicy soup', price: 9.95, is_spicy: true, display_order: 1 },
        { category_id: 3, name: 'Chicken Chow Mein', description: 'Stir-fried noodles with chicken', price: 16.95, is_spicy: false, display_order: 1 },
        { category_id: 7, name: 'General Tso\'s Chicken', description: 'Crispy chicken in sweet sauce', price: 18.95, is_spicy: true, display_order: 1 }
      ];
      
      await MenuItem.bulkCreate(sampleItems);
      console.log('✅ Sample menu items seeded successfully');
    }
    
  } catch (error) {
    console.error('❌ Error seeding data:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
};

// Initialize database
if (process.env.NODE_ENV !== 'test') {
  syncDatabase();
}

module.exports = {
  sequelize,
  Restaurant,
  User,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  ComboType,
  ComboAvailableItems
};