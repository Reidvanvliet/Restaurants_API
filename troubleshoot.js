// troubleshoot.js - Run this to diagnose database issues
require('dotenv').config();

console.log('🔧 Gold Chopsticks Database Troubleshooting\n');

// Step 1: Check environment setup
console.log('1️⃣ Checking Environment Variables:');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('   DATABASE_URL exists:', !!process.env.DATABASE_URL);

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  console.log('   Database Host:', url.hostname);
  console.log('   Database Port:', url.port);
  console.log('   Database Name:', url.pathname.substring(1));
  console.log('   Database User:', url.username);
  console.log('   Password Length:', url.password ? url.password.length : 0, 'characters');
} else {
  console.log('   DB_HOST:', process.env.DB_HOST || 'not set');
  console.log('   DB_PORT:', process.env.DB_PORT || 'not set');
  console.log('   DB_NAME:', process.env.DB_NAME || 'not set');
  console.log('   DB_USER:', process.env.DB_USER || 'not set');
  console.log('   DB_PASSWORD exists:', !!process.env.DB_PASSWORD);
}

console.log('\n2️⃣ Checking Required Dependencies:');

// Check if required packages are installed
const requiredPackages = ['sequelize', 'pg', 'pg-hstore'];
for (const pkg of requiredPackages) {
  try {
    require.resolve(pkg);
    console.log(`   ✅ ${pkg}: installed`);
  } catch (error) {
    console.log(`   ❌ ${pkg}: NOT INSTALLED`);
  }
}

console.log('\n3️⃣ Testing Basic Connection:');

async function testConnection() {
  const { Sequelize } = require('sequelize');
  
  let sequelize;
  
  try {
    if (process.env.DATABASE_URL) {
      sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      });
    } else {
      console.log('   ❌ No DATABASE_URL found');
      return false;
    }
    
    console.log('   🔄 Attempting connection...');
    await sequelize.authenticate();
    console.log('   ✅ Connection successful!');
    
    // Test simple query
    const result = await sequelize.query('SELECT NOW() as current_time');
    console.log('   ✅ Query test successful:', result[0][0].current_time);
    
    await sequelize.close();
    return true;
    
  } catch (error) {
    console.log('   ❌ Connection failed:', error.message);
    
    if (error.message.includes('ECONNRESET')) {
      console.log('   💡 This looks like a network/SSL issue');
      console.log('      - Your database might be sleeping (Render free tier)');
      console.log('      - Try again in 30 seconds');
      console.log('      - Check Render dashboard for database status');
    } else if (error.message.includes('authentication failed')) {
      console.log('   💡 This looks like a credentials issue');
      console.log('      - Double-check your DATABASE_URL');
      console.log('      - Try regenerating credentials in Render');
    }
    
    return false;
  }
}

console.log('\n4️⃣ Checking File Structure:');

const fs = require('path');
const requiredFiles = [
  'models/User.js',
  'models/MenuCategory.js', 
  'models/MenuItem.js',
  'models/Order.js',
  'models/OrderItem.js'
];

for (const file of requiredFiles) {
  try {
    require.resolve(`./${file}`);
    console.log(`   ✅ ${file}: exists`);
  } catch (error) {
    console.log(`   ❌ ${file}: NOT FOUND`);
  }
}

// Run the tests
async function runDiagnostics() {
  const connectionSuccess = await testConnection();
  
  console.log('\n📋 DIAGNOSTIC SUMMARY:');
  console.log('================================');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ CRITICAL: DATABASE_URL not set');
    console.log('   Add this to your server/.env file:');
    console.log('   DATABASE_URL=postgresql://user:pass@host:port/dbname');
    return;
  }
  
  if (!connectionSuccess) {
    console.log('❌ CRITICAL: Cannot connect to database');
    console.log('\n🔧 Quick fixes to try:');
    console.log('1. Check Render dashboard - is your database running?');
    console.log('2. Try regenerating your database connection string');
    console.log('3. Wait 30 seconds and try again (database might be sleeping)');
    console.log('4. Copy a fresh DATABASE_URL from Render dashboard');
    return;
  }
  
  console.log('✅ Connection working! Your database setup looks good.');
  console.log('\n🚀 Try starting your server again:');
  console.log('   npm run dev');
}

runDiagnostics().catch(console.error);