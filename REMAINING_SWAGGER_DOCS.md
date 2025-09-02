# Swagger Documentation for Remaining Routes

## Overview
This document provides Swagger/OpenAPI documentation for the remaining API routes: Admin, Payments, Combos, and Google routes.

## Admin Routes (/api/admin)

```yaml
/api/admin/dashboard:
  get:
    tags:
      - Admin
    summary: Get admin dashboard statistics
    description: Get comprehensive dashboard statistics for admin users
    security:
      - BearerAuth: []
    responses:
      200:
        description: Dashboard statistics retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                totalUsers:
                  type: integer
                totalOrders:
                  type: integer
                totalRevenue:
                  type: number
                  format: decimal
                recentOrders:
                  type: array
                  items:
                    $ref: '#/components/schemas/Order'
                popularItems:
                  type: array
                  items:
                    type: object
                    properties:
                      item:
                        $ref: '#/components/schemas/MenuItem'
                      orderCount:
                        type: integer
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
      500:
        $ref: '#/components/responses/ServerError'

/api/admin/orders/stats:
  get:
    tags:
      - Admin
    summary: Get detailed order statistics
    description: Get comprehensive order statistics with filtering options
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: startDate
        schema:
          type: string
          format: date
        description: Start date for statistics
      - in: query
        name: endDate
        schema:
          type: string
          format: date
        description: End date for statistics
      - in: query
        name: period
        schema:
          type: string
          enum: [daily, weekly, monthly]
        description: Statistics period grouping
    responses:
      200:
        description: Order statistics retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                totalOrders:
                  type: integer
                totalRevenue:
                  type: number
                averageOrderValue:
                  type: number
                ordersByStatus:
                  type: object
                ordersByType:
                  type: object
                revenueByPeriod:
                  type: array
                  items:
                    type: object
                    properties:
                      period:
                        type: string
                      revenue:
                        type: number
                      orders:
                        type: integer
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
```

## Payments Routes (/api/payments)

```yaml
components:
  schemas:
    PaymentIntentRequest:
      type: object
      required:
        - orderId
        - amount
      properties:
        orderId:
          type: integer
          description: Order ID for payment
        amount:
          type: number
          format: decimal
          description: Payment amount in dollars
        currency:
          type: string
          default: usd
          description: Payment currency
        
    PaymentIntentResponse:
      type: object
      properties:
        clientSecret:
          type: string
          description: Stripe client secret for frontend
        paymentIntentId:
          type: string
          description: Stripe payment intent ID
        amount:
          type: number
          description: Payment amount
        
    PaymentConfirmation:
      type: object
      required:
        - paymentIntentId
        - orderId
      properties:
        paymentIntentId:
          type: string
          description: Stripe payment intent ID
        orderId:
          type: integer
          description: Order ID

/api/payments/create-intent:
  post:
    tags:
      - Payments
    summary: Create payment intent
    description: Create a Stripe payment intent for order payment
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/PaymentIntentRequest'
    responses:
      200:
        description: Payment intent created successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaymentIntentResponse'
      400:
        $ref: '#/components/responses/BadRequest'
      401:
        $ref: '#/components/responses/Unauthorized'
      500:
        $ref: '#/components/responses/ServerError'

/api/payments/confirm:
  post:
    tags:
      - Payments
    summary: Confirm payment
    description: Confirm successful payment and update order status
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/PaymentConfirmation'
    responses:
      200:
        description: Payment confirmed successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                order:
                  $ref: '#/components/schemas/Order'
      400:
        $ref: '#/components/responses/BadRequest'
      401:
        $ref: '#/components/responses/Unauthorized'
      500:
        $ref: '#/components/responses/ServerError'

/api/payments/webhook:
  post:
    tags:
      - Payments
    summary: Stripe webhook handler
    description: Handle Stripe webhook events for payment processing
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            description: Stripe webhook event data
    responses:
      200:
        description: Webhook processed successfully
      400:
        description: Invalid webhook signature or data
```

## Combos Routes (/api/combos)

```yaml
components:
  schemas:
    ComboType:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
          example: "Lunch Special"
        description:
          type: string
        price:
          type: number
          format: decimal
        isActive:
          type: boolean
        items:
          type: array
          items:
            $ref: '#/components/schemas/MenuItem'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    
    ComboRequest:
      type: object
      required:
        - name
        - price
      properties:
        name:
          type: string
          description: Combo name
        description:
          type: string
          description: Combo description
        price:
          type: number
          format: decimal
          description: Combo price
        isActive:
          type: boolean
          default: true
        itemIds:
          type: array
          items:
            type: integer
          description: Menu item IDs included in combo

/api/combos:
  get:
    tags:
      - Combos
    summary: Get all combo types
    description: Retrieve all available combo meal types
    responses:
      200:
        description: Combos retrieved successfully
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/ComboType'
      500:
        $ref: '#/components/responses/ServerError'
  
  post:
    tags:
      - Combos
    summary: Create new combo type (Admin only)
    description: Create a new combo meal type
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ComboRequest'
    responses:
      201:
        description: Combo created successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ComboType'
      400:
        $ref: '#/components/responses/BadRequest'
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
      500:
        $ref: '#/components/responses/ServerError'

/api/combos/{id}:
  get:
    tags:
      - Combos
    summary: Get combo details
    description: Get detailed information about a specific combo
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: integer
        description: Combo ID
    responses:
      200:
        description: Combo details retrieved successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ComboType'
      404:
        $ref: '#/components/responses/NotFound'
      500:
        $ref: '#/components/responses/ServerError'
  
  put:
    tags:
      - Combos
    summary: Update combo (Admin only)
    description: Update an existing combo meal type
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: integer
        description: Combo ID
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ComboRequest'
    responses:
      200:
        description: Combo updated successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ComboType'
      400:
        $ref: '#/components/responses/BadRequest'
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
      404:
        $ref: '#/components/responses/NotFound'
      500:
        $ref: '#/components/responses/ServerError'
  
  delete:
    tags:
      - Combos
    summary: Delete combo (Admin only)
    description: Delete a combo meal type
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: integer
        description: Combo ID
    responses:
      200:
        description: Combo deleted successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  example: "Combo deleted successfully"
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
      404:
        $ref: '#/components/responses/NotFound'
      500:
        $ref: '#/components/responses/ServerError'
```

## Google Routes (/api/google)

```yaml
components:
  schemas:
    ImageUploadResponse:
      type: object
      properties:
        message:
          type: string
        filename:
          type: string
        url:
          type: string
        size:
          type: integer

/api/google/upload-image:
  post:
    tags:
      - Google Services
    summary: Upload image to Google Cloud Storage
    description: Upload an image file to Google Cloud Storage (Admin only)
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              image:
                type: string
                format: binary
                description: Image file to upload
              folder:
                type: string
                description: Destination folder (optional)
                default: general
    responses:
      200:
        description: Image uploaded successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ImageUploadResponse'
      400:
        description: No image file provided or invalid file type
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
      500:
        $ref: '#/components/responses/ServerError'

/api/google/delete-image:
  delete:
    tags:
      - Google Services
    summary: Delete image from Google Cloud Storage
    description: Delete an image from Google Cloud Storage (Admin only)
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - filename
            properties:
              filename:
                type: string
                description: Filename to delete
    responses:
      200:
        description: Image deleted successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  example: "Image deleted successfully"
      400:
        description: Filename is required
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
      500:
        $ref: '#/components/responses/ServerError'

/api/google/storage-status:
  get:
    tags:
      - Google Services
    summary: Get Google Cloud Storage status
    description: Check the status and configuration of Google Cloud Storage service
    security:
      - BearerAuth: []
    responses:
      200:
        description: Storage status retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  enum: [available, unavailable]
                projectId:
                  type: string
                bucketName:
                  type: string
                isConfigured:
                  type: boolean
      401:
        $ref: '#/components/responses/Unauthorized'
      403:
        $ref: '#/components/responses/Forbidden'
      500:
        $ref: '#/components/responses/ServerError'
```

## Common Response Schemas

```yaml
components:
  responses:
    BadRequest:
      description: Bad request - validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    Unauthorized:
      description: Unauthorized - authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    Forbidden:
      description: Forbidden - insufficient permissions
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    ServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

## Tags for Organization

```yaml
tags:
  - name: Authentication
    description: User authentication and account management
  - name: Menu
    description: Restaurant menu management and viewing
  - name: Orders
    description: Order placement and management
  - name: Restaurants
    description: Restaurant management (admin only)
  - name: Users
    description: User profile and account management
  - name: Admin
    description: Administrative operations and statistics
  - name: Payments
    description: Payment processing with Stripe
  - name: Combos
    description: Combo meal management
  - name: Google Services
    description: Google Cloud services integration
```

## Notes for Implementation

1. **Add these definitions** to your main `swagger.js` file or create separate files for each route group
2. **Update route files** with the appropriate `@swagger` annotations
3. **Test the documentation** at `/api/docs` after implementation
4. **Ensure all schemas** reference existing data models
5. **Add authentication requirements** where appropriate
6. **Include restaurant context** parameters for multi-tenant routes

This documentation covers all the remaining API routes with comprehensive Swagger/OpenAPI specifications, including request/response schemas, authentication requirements, and proper error handling.