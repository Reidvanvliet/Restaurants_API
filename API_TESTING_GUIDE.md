# Multi-Tenant API Testing Guide

## Overview
This guide covers testing all API endpoints with proper restaurant context filtering and role-based access control.

## Prerequisites
1. Run database migrations:
   ```sql
   -- Run in DBeaver or your PostgreSQL client
   \i 001-add-multi-tenant-support.sql
   \i 002-add-user-roles.sql
   ```

2. Set up local subdomains in hosts file:
   ```
   127.0.0.1 goldchopsticks.localhost
   127.0.0.1 pizzapalace.localhost
   127.0.0.1 sushiworld.localhost
   ```

3. Create test restaurants and users (see database setup section below)

## Authentication Endpoints

### 1. User Registration (Restaurant-Scoped)
```http
POST http://goldchopsticks.localhost:5000/api/auth/signup
Host: goldchopsticks.localhost:5000
Content-Type: application/json

{
  "email": "user@goldchopsticks.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-0101",
  "address": "123 Main St, City, State"
}
```
**Expected:** User created for Gold Chopsticks restaurant with JWT token

### 2. User Login (Restaurant-Scoped)
```http
POST http://goldchopsticks.localhost:5000/api/auth/signin
Host: goldchopsticks.localhost:5000
Content-Type: application/json

{
  "email": "user@goldchopsticks.com",
  "password": "password123"
}
```
**Expected:** Login successful with restaurant context in response

## Menu Endpoints

### 3. Get Restaurant Menu (Public)
```http
GET http://goldchopsticks.localhost:5000/api/menu
Host: goldchopsticks.localhost:5000
```
**Expected:** Menu items filtered to Gold Chopsticks only, includes restaurant info

### 4. Get Menu Categories
```http
GET http://goldchopsticks.localhost:5000/api/menu/categories
Host: goldchopsticks.localhost:5000
```
**Expected:** Categories filtered to Gold Chopsticks only

### 5. Get Single Menu Item
```http
GET http://goldchopsticks.localhost:5000/api/menu/1
Host: goldchopsticks.localhost:5000
```
**Expected:** Item details (only if item belongs to Gold Chopsticks)

### 6. Create Menu Item (Restaurant Admin)
```http
POST http://goldchopsticks.localhost:5000/api/menu
Host: goldchopsticks.localhost:5000
Authorization: Bearer <restaurant_admin_jwt_token>
Content-Type: application/json

{
  "categoryId": 1,
  "name": "New Test Dish",
  "description": "Test description",
  "price": 12.99,
  "isSpicy": true,
  "isAvailable": true,
  "displayOrder": 1
}
```
**Expected:** Item created for Gold Chopsticks only

### 7. Update Menu Item (Restaurant Admin)
```http
PUT http://goldchopsticks.localhost:5000/api/menu/1
Host: goldchopsticks.localhost:5000
Authorization: Bearer <restaurant_admin_jwt_token>
Content-Type: application/json

{
  "name": "Updated Dish Name",
  "price": 15.99
}
```
**Expected:** Only items belonging to Gold Chopsticks can be updated

### 8. Delete Menu Item (Restaurant Admin)
```http
DELETE http://goldchopsticks.localhost:5000/api/menu/1
Host: goldchopsticks.localhost:5000
Authorization: Bearer <restaurant_admin_jwt_token>
```
**Expected:** Only items belonging to Gold Chopsticks can be deleted

### 9. Get All Menu Items (Restaurant Admin)
```http
GET http://goldchopsticks.localhost:5000/api/menu/all
Host: goldchopsticks.localhost:5000
Authorization: Bearer <restaurant_admin_jwt_token>
```
**Expected:** All items including unavailable, filtered to Gold Chopsticks

## Order Endpoints

### 10. Create Order
```http
POST http://goldchopsticks.localhost:5000/api/orders
Host: goldchopsticks.localhost:5000
Content-Type: application/json

{
  "customerEmail": "customer@test.com",
  "customerFirstName": "Jane",
  "customerLastName": "Smith",
  "customerPhone": "555-0102",
  "customerAddress": "456 Oak St, City, State",
  "orderType": "delivery",
  "paymentMethod": "card",
  "paymentStatus": "pending",
  "items": [
    {
      "menuItemId": 1,
      "quantity": 2,
      "price": 12.99,
      "itemName": "Test Dish"
    }
  ],
  "subtotal": 25.98,
  "tax": 2.60,
  "deliveryFee": 3.99,
  "total": 32.57
}
```
**Expected:** Order created for Gold Chopsticks, validates menu items belong to restaurant

### 11. Get User Orders
```http
GET http://goldchopsticks.localhost:5000/api/orders/user/1
Host: goldchopsticks.localhost:5000
Authorization: Bearer <user_jwt_token>
```
**Expected:** Orders filtered to user and Gold Chopsticks restaurant

### 12. Get Order Details
```http
GET http://goldchopsticks.localhost:5000/api/orders/1
Host: goldchopsticks.localhost:5000
Authorization: Bearer <user_or_admin_jwt_token>
```
**Expected:** Order details (only if order belongs to Gold Chopsticks)

### 13. Update Order Status (Restaurant Admin)
```http
PUT http://goldchopsticks.localhost:5000/api/orders/1/status
Host: goldchopsticks.localhost:5000
Authorization: Bearer <restaurant_admin_jwt_token>
Content-Type: application/json

{
  "status": "confirmed"
}
```
**Expected:** Status updated (only for orders belonging to Gold Chopsticks)

### 14. Get All Orders (Restaurant Admin)
```http
GET http://goldchopsticks.localhost:5000/api/orders/admin/all?page=1&limit=20
Host: goldchopsticks.localhost:5000
Authorization: Bearer <restaurant_admin_jwt_token>
```
**Expected:** All orders filtered to Gold Chopsticks, includes restaurant info

### 15. Get Order Statistics (Restaurant Admin)
```http
GET http://goldchopsticks.localhost:5000/api/orders/admin/stats
Host: goldchopsticks.localhost:5000
Authorization: Bearer <restaurant_admin_jwt_token>
```
**Expected:** Statistics filtered to Gold Chopsticks, includes restaurant info

### 16. Search Orders (Restaurant Admin)
```http
GET http://goldchopsticks.localhost:5000/api/orders/admin/search?q=customer@test.com
Host: goldchopsticks.localhost:5000
Authorization: Bearer <restaurant_admin_jwt_token>
```
**Expected:** Search results filtered to Gold Chopsticks only

## Restaurant Management Endpoints

### 17. Get All Restaurants (Super Admin)
```http
GET http://localhost:5000/api/restaurants
Authorization: Bearer <super_admin_jwt_token>
```
**Expected:** List of all restaurants (super admin only)

### 18. Get Restaurant Details (Restaurant Admin)
```http
GET http://goldchopsticks.localhost:5000/api/restaurants/1
Host: goldchopsticks.localhost:5000
Authorization: Bearer <restaurant_admin_jwt_token>
```
**Expected:** Restaurant details (only if admin belongs to that restaurant)

### 19. Update Restaurant (Restaurant Admin)
```http
PUT http://goldchopsticks.localhost:5000/api/restaurants/1
Host: goldchopsticks.localhost:5000
Authorization: Bearer <restaurant_admin_jwt_token>
Content-Type: application/json

{
  "name": "Updated Restaurant Name",
  "themeColors": {
    "primary": "#ff6b35",
    "secondary": "#004e89"
  }
}
```
**Expected:** Restaurant updated (only by restaurant admin or super admin)

## Cross-Restaurant Access Tests

### 20. Cross-Restaurant Menu Access (Should Fail)
```http
GET http://pizzapalace.localhost:5000/api/menu
Host: pizzapalace.localhost:5000
Authorization: Bearer <goldchopsticks_user_jwt_token>
```
**Expected:** Empty menu or 404 (token from different restaurant)

### 21. Cross-Restaurant Order Creation (Should Fail)
```http
POST http://pizzapalace.localhost:5000/api/orders
Host: pizzapalace.localhost:5000
Content-Type: application/json

{
  "customerEmail": "test@test.com",
  "customerFirstName": "Test",
  "customerLastName": "User",
  "customerPhone": "555-0103",
  "orderType": "pickup",
  "paymentMethod": "cash_on_arrival",
  "items": [
    {
      "menuItemId": 1,  // Gold Chopsticks item ID
      "quantity": 1,
      "price": 10.99,
      "itemName": "Cross Restaurant Item"
    }
  ],
  "subtotal": 10.99,
  "tax": 1.10,
  "total": 12.09
}
```
**Expected:** 400 error - menu items not available for this restaurant

## Role-Based Access Tests

### 22. Regular User Accessing Admin Endpoint (Should Fail)
```http
GET http://goldchopsticks.localhost:5000/api/menu/all
Host: goldchopsticks.localhost:5000
Authorization: Bearer <regular_user_jwt_token>
```
**Expected:** 403 Forbidden - admin access required

### 23. Restaurant Admin Accessing Super Admin Endpoint (Should Fail)
```http
GET http://localhost:5000/api/restaurants
Authorization: Bearer <restaurant_admin_jwt_token>
```
**Expected:** 403 Forbidden - super admin access required

### 24. Super Admin Accessing Any Restaurant (Should Work)
```http
GET http://goldchopsticks.localhost:5000/api/restaurants/1
Host: goldchopsticks.localhost:5000
Authorization: Bearer <super_admin_jwt_token>
```
**Expected:** Access granted to any restaurant data

## Database Setup for Testing

### Create Test Restaurants
```sql
INSERT INTO restaurants (name, slug, domain, is_active, created_at, updated_at) VALUES
('Gold Chopsticks', 'goldchopsticks', NULL, true, NOW(), NOW()),
('Pizza Palace', 'pizzapalace', NULL, true, NOW(), NOW()),
('Sushi World', 'sushiworld', 'sushiworld.com', true, NOW(), NOW());
```

### Create Test Users with Different Roles
```sql
-- Super Admin (can access all restaurants)
INSERT INTO users (email, password, first_name, last_name, phone, address, restaurant_id, role, is_admin, created_at, updated_at) VALUES
('superadmin@platform.com', '$2b$10$encrypted_password_hash', 'Super', 'Admin', '555-0001', '1 Platform St', 1, 'super_admin', true, NOW(), NOW());

-- Restaurant Admins (can manage their specific restaurant)
INSERT INTO users (email, password, first_name, last_name, phone, address, restaurant_id, role, is_admin, created_at, updated_at) VALUES
('admin@goldchopsticks.com', '$2b$10$encrypted_password_hash', 'Gold', 'Admin', '555-0002', '2 Gold St', 1, 'restaurant_admin', true, NOW(), NOW()),
('admin@pizzapalace.com', '$2b$10$encrypted_password_hash', 'Pizza', 'Admin', '555-0003', '3 Pizza Ave', 2, 'restaurant_admin', true, NOW(), NOW());

-- Regular Users (can only place orders and view menus)
INSERT INTO users (email, password, first_name, last_name, phone, address, restaurant_id, role, is_admin, created_at, updated_at) VALUES
('user@goldchopsticks.com', '$2b$10$encrypted_password_hash', 'John', 'User', '555-0004', '4 User Rd', 1, 'user', false, NOW(), NOW()),
('user@pizzapalace.com', '$2b$10$encrypted_password_hash', 'Jane', 'User', '555-0005', '5 Customer Ln', 2, 'user', false, NOW(), NOW());
```

### Create Test Menu Categories
```sql
INSERT INTO menu_categories (restaurant_id, name, display_order, is_active, created_at, updated_at) VALUES
(1, 'Appetizers', 1, true, NOW(), NOW()),
(1, 'Main Dishes', 2, true, NOW(), NOW()),
(2, 'Pizza', 1, true, NOW(), NOW()),
(2, 'Pasta', 2, true, NOW(), NOW());
```

### Create Test Menu Items
```sql
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_spicy, is_available, display_order, created_at, updated_at) VALUES
(1, 1, 'Spring Rolls', 'Fresh vegetables wrapped in rice paper', 8.99, false, true, 1, NOW(), NOW()),
(1, 2, 'General Tso Chicken', 'Sweet and spicy chicken dish', 16.99, true, true, 1, NOW(), NOW()),
(2, 3, 'Margherita Pizza', 'Classic pizza with tomato sauce and mozzarella', 12.99, false, true, 1, NOW(), NOW()),
(2, 4, 'Spaghetti Carbonara', 'Pasta with eggs, cheese, and pancetta', 14.99, false, true, 1, NOW(), NOW());
```

## Expected Behaviors Summary

1. **Restaurant Context**: All endpoints require proper restaurant context via subdomain
2. **Data Isolation**: Users can only access data from their assigned restaurant
3. **Role Validation**: Different endpoints require different permission levels
4. **Token Verification**: JWT tokens include restaurant context and are validated
5. **Cross-Restaurant Prevention**: Users cannot access or modify data from other restaurants
6. **Response Formats**: API responses include restaurant information for context

## Troubleshooting Common Issues

1. **"Restaurant context required"** - Check subdomain format and hosts file
2. **"Token restaurant context invalid"** - Token was issued for different restaurant
3. **"Access denied"** - User role insufficient for requested operation
4. **"Not found"** - Resource doesn't exist or doesn't belong to current restaurant
5. **Empty responses** - Data filtered correctly, no items for current restaurant

## Testing Tools Recommendation

- **Postman**: Create collections for each restaurant with different environments
- **curl**: Use command line for quick tests
- **VS Code REST Client**: Use .http files for organized testing
- **Browser Developer Tools**: Test subdomain behavior and cookie handling