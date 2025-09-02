# Swagger API Documentation Setup

## Overview
The API now includes comprehensive Swagger/OpenAPI 3.0 documentation accessible at `/api/docs` endpoint.

## Installation
Add the following dependencies to your `package.json`:

```json
{
  "dependencies": {
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^4.6.3"
  }
}
```

Install the dependencies:
```bash
npm install swagger-jsdoc swagger-ui-express
```

## Accessing Documentation

### Local Development
- **Main API Docs**: http://localhost:5000/api/docs
- **Gold Chopsticks**: http://goldchopsticks.localhost:5000/api/docs
- **Pizza Palace**: http://pizzapalace.localhost:5000/api/docs

### Health Check
- **Health Endpoint**: http://localhost:5000/api/health
  - Returns API status and links to documentation

## Features

### 🔧 **Complete API Documentation**
- **Authentication endpoints** with OAuth support
- **Menu management** with restaurant context
- **Order processing** with multi-tenant filtering
- **Restaurant management** with role-based access

### 🔐 **Security Documentation**
- **JWT Bearer authentication** configuration
- **Role-based access control** explanations
- **Restaurant context requirements** clearly documented

### 🏢 **Multi-Tenant Support**
- **Subdomain examples** for different restaurants
- **Restaurant context** parameter documentation
- **Cross-restaurant security** explanations

### 📊 **Interactive Testing**
- **Try it out** functionality for all endpoints
- **Authentication persistence** across requests
- **Request/response examples** with real data
- **Error response** documentation with codes

## Documentation Structure

### Main Sections
1. **Authentication** - User registration, login, OAuth
2. **Menu** - Menu items and categories management  
3. **Orders** - Order creation and management
4. **Restaurants** - Restaurant management (admin only)

### Key Components
- **Comprehensive schemas** for all data models
- **Detailed request/response** examples
- **Error handling** documentation
- **Security requirements** for each endpoint
- **Multi-server** configuration for different environments

## Swagger Configuration Highlights

### Server Configurations
```yaml
servers:
  - url: http://goldchopsticks.localhost:5000
    description: Gold Chopsticks Restaurant (Development)
  - url: http://pizzapalace.localhost:5000
    description: Pizza Palace Restaurant (Development)
  - url: http://localhost:5000
    description: Platform Admin (Development)
```

### Authentication Security
```yaml
securitySchemes:
  BearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
    description: JWT token obtained from login endpoint
```

### Restaurant Context Documentation
All restaurant-scoped endpoints include:
- **Host header requirement** with examples
- **Restaurant context explanations**
- **Multi-tenant security** considerations
- **Cross-restaurant access prevention**

## Usage Examples

### Authentication Flow
1. **Register/Login** at restaurant-specific subdomain
2. **Copy JWT token** from response
3. **Click "Authorize"** in Swagger UI
4. **Paste token** (without "Bearer " prefix)
5. **Test protected endpoints** with authentication

### Testing Restaurant Context
1. **Use restaurant subdomain** (e.g., goldchopsticks.localhost:5000)
2. **Set Host header** in requests
3. **Verify restaurant filtering** in responses
4. **Test cross-restaurant access** (should fail)

## Customizations

### UI Customizations
- **Hidden top bar** for cleaner look
- **Persistent authorization** across browser sessions
- **Custom site title** with multi-tenant branding
- **Explorer enabled** for endpoint discovery

### Documentation Enhancements
- **Rich descriptions** with multi-tenant context
- **Detailed examples** for each restaurant type
- **Comprehensive error codes** and messages
- **Role-based access** explanations

## Benefits

### For Developers
- **Complete API reference** in one place
- **Interactive testing** without additional tools
- **Authentication handling** built-in
- **Multi-tenant examples** and edge cases

### For API Users
- **Clear endpoint documentation** with examples
- **Security requirements** clearly explained
- **Restaurant context** understanding
- **Error handling** guidance

### For Restaurant Owners
- **Understanding of API capabilities**
- **Security and data isolation** assurance
- **Integration possibilities** documentation
- **Role-based permissions** clarity

## Maintenance

### Adding New Endpoints
1. **Add Swagger annotations** to route files
2. **Define schemas** in swagger.js or route files
3. **Include restaurant context** parameters
4. **Document security requirements**

### Updating Documentation
1. **Modify annotations** in route files
2. **Update schemas** for data model changes
3. **Test documentation** at `/api/docs`
4. **Verify examples** work correctly

The Swagger documentation provides a comprehensive, interactive reference for the entire multi-tenant restaurant API, making it easy for developers to understand, test, and integrate with the system.