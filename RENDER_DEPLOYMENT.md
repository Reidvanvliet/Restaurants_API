# Deploying Multi-Tenant Restaurant API to Render

## Overview
This guide covers deploying the Node.js backend to Render with your existing PostgreSQL database.

## Prerequisites
- Render account created
- PostgreSQL database already hosted on Render
- GitHub repository with your code
- Environment variables ready

## Step 1: Prepare Your Repository

### 1.1 Create `.env.example`
Create a template for environment variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
DB_HOST=your-render-db-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-db-username
DB_PASSWORD=your-db-password

# Application Settings
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secure-jwt-secret-key
PLATFORM_DOMAIN=yourapi.com

# Frontend Configuration
CLIENT_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com

# Google Cloud Storage (Optional)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account.json

# Stripe Payment Processing (Optional)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Service Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 1.2 Update `package.json`
Ensure your package.json has the correct start script:

```json
{
  "name": "multi-tenant-restaurant-api",
  "version": "1.0.0",
  "description": "Multi-tenant restaurant management API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "node -e \"require('./migrations/001-add-multi-tenant-support.js').up()\"",
    "seed": "node -e \"console.log('Seeding data...'); process.exit(0);\""
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

### 1.3 Create `render.yaml` (Optional)
For Infrastructure as Code deployment:

```yaml
services:
  - type: web
    name: restaurant-api
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: restaurant-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: PLATFORM_DOMAIN
        value: your-api-domain.onrender.com
```

## Step 2: Deploy to Render

### 2.1 Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `restaurant-api` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your deployment branch)
- **Runtime**: `Node`

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 2.2 Environment Variables
Add these environment variables in Render dashboard:

**Required Variables:**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=[Your Render PostgreSQL connection string]
JWT_SECRET=[Generate a strong secret]
PLATFORM_DOMAIN=your-service-name.onrender.com
```

**Optional Variables:**
```
CLIENT_URL=https://your-frontend.com
CORS_ORIGIN=https://your-frontend.com
GOOGLE_CLOUD_PROJECT_ID=your-project
GOOGLE_CLOUD_BUCKET_NAME=your-bucket
STRIPE_SECRET_KEY=sk_live_...
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 2.3 Advanced Settings
- **Instance Type**: `Starter` (for testing) or `Standard` (for production)
- **Auto-Deploy**: `Yes` (deploys automatically on git push)
- **Health Check Path**: `/api/health`

## Step 3: Database Migration

### 3.1 Run Migrations After Deployment
Since your database is already on Render, you can run migrations via:

**Option 1: Render Shell**
1. Go to your service in Render dashboard
2. Click **"Shell"** tab
3. Run migration commands:
```bash
node migrations/001-add-multi-tenant-support.js
node migrations/002-add-user-roles.js
```

**Option 2: Database Tool (DBeaver)**
Connect to your Render database and run the SQL files:
```sql
\i 001-add-multi-tenant-support.sql
\i 002-add-user-roles.sql
```

### 3.2 Seed Initial Data
Add some test restaurants and users:
```sql
-- Create test restaurants
INSERT INTO restaurants (name, slug, domain, is_active, theme_colors, contact_info, created_at, updated_at) VALUES
('Gold Chopsticks', 'goldchopsticks', NULL, true, 
 '{"primary": "#d97706", "secondary": "#92400e", "accent": "#fbbf24"}',
 '{"phone": "555-0123", "email": "info@goldchopsticks.com"}',
 NOW(), NOW()),
('Pizza Palace', 'pizzapalace', NULL, true,
 '{"primary": "#dc2626", "secondary": "#991b1b", "accent": "#fbbf24"}',
 '{"phone": "555-0124", "email": "info@pizzapalace.com"}',
 NOW(), NOW());

-- Create a super admin user
INSERT INTO users (email, password, first_name, last_name, phone, address, restaurant_id, role, is_admin, created_at, updated_at) VALUES
('admin@yourapi.com', '$2b$10$YourHashedPasswordHere', 'Super', 'Admin', '555-0001', '123 Admin St', 1, 'super_admin', true, NOW(), NOW());
```

## Step 4: Custom Domain Setup (Optional)

### 4.1 Configure Custom Domain
1. In Render dashboard, go to your service
2. Click **"Settings"** → **"Custom Domains"**
3. Add your domain: `api.yourdomain.com`
4. Update DNS records as instructed by Render

### 4.2 Update Environment Variables
```
PLATFORM_DOMAIN=api.yourdomain.com
CLIENT_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

## Step 5: Testing Deployment

### 5.1 Health Check
Test your deployment:
```bash
curl https://your-service.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Multi-Tenant Restaurant API is running!",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "documentation": "https://your-service.onrender.com/api/docs"
}
```

### 5.2 API Documentation
Visit: `https://your-service.onrender.com/api/docs`

### 5.3 Test Multi-Tenant Setup
Test restaurant context with subdomains:
1. Set up CNAME records for subdomains:
   - `goldchopsticks.yourdomain.com` → `your-service.onrender.com`
   - `pizzapalace.yourdomain.com` → `your-service.onrender.com`

## Step 6: Production Configuration

### 6.1 Security Headers
Your app already includes security middleware. Verify in logs:
- CORS properly configured
- Helmet security headers applied
- Rate limiting active

### 6.2 Logging
Monitor your app logs in Render dashboard:
- Database connections
- Restaurant context resolution
- Authentication flows
- Error handling

### 6.3 Performance Monitoring
- Monitor response times in Render metrics
- Check database connection pooling
- Verify restaurant cache performance

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
```javascript
// Check DATABASE_URL format
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

**2. Restaurant Context Not Working**
- Verify `PLATFORM_DOMAIN` environment variable
- Check subdomain DNS configuration
- Review restaurant cache logs

**3. CORS Issues**
```javascript
// Update CORS_ORIGIN environment variable
CORS_ORIGIN=https://your-frontend-domain.com
```

**4. Build Failures**
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Review build logs for missing packages

### Debug Commands
```bash
# Check environment variables
printenv | grep -E "(DATABASE|JWT|PLATFORM)"

# Test database connection
node -e "const {sequelize} = require('./config/database'); sequelize.authenticate().then(() => console.log('DB OK')).catch(console.error)"

# Check restaurant cache
curl https://your-service.onrender.com/api/restaurants/context/health
```

## Cost Optimization

### Render Pricing Tiers
- **Starter**: $7/month - Good for testing
- **Standard**: $25/month - Production ready
- **Pro**: $85/month - High performance

### Optimization Tips
1. **Use Starter tier** for development/testing
2. **Enable auto-scaling** for variable traffic
3. **Monitor database usage** to optimize queries
4. **Use restaurant caching** to reduce database calls

## Security Checklist

- ✅ Environment variables properly set
- ✅ JWT secret is strong and unique
- ✅ Database credentials secure
- ✅ CORS configured for your frontend
- ✅ HTTPS enforced (automatic with Render)
- ✅ Rate limiting enabled
- ✅ Input validation active

Your Multi-Tenant Restaurant API is now ready for production deployment on Render! 🚀