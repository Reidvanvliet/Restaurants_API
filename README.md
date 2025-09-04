# Multi-Tenant Restaurant API

A comprehensive REST API for multi-tenant restaurant management built with Node.js, Express, and PostgreSQL. This API supports restaurant operations including menu management, order processing, payments via Stripe, and multi-tenant architecture.

## 🌐 Live Deployment

- **API Base URL**: https://restaurants-api-d19o.onrender.com/
- **Interactive Documentation**: https://restaurants-api-d19o.onrender.com/api/docs

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Support for multiple restaurants in a single deployment
- **User Authentication**: JWT-based authentication with OAuth support (Google, Facebook)
- **Menu Management**: Full CRUD operations for menu categories and items
- **Order Processing**: Complete order lifecycle management
- **Payment Integration**: Stripe payment processing with webhook support
- **File Upload**: Google Cloud Storage integration for image uploads
- **Email Service**: Automated email notifications with Gmail/SMTP fallback

### Technical Features
- **RESTful API Design**: Clean, consistent REST endpoints
- **Interactive Documentation**: Swagger/OpenAPI documentation
- **Database**: PostgreSQL with Sequelize ORM
- **Security**: Helmet, CORS, input validation, and JWT tokens
- **Error Handling**: Centralized error handling and logging
- **Health Checks**: Built-in health monitoring endpoint

## 📋 API Endpoints

### Authentication (`/api/auth`)
- User registration and login
- OAuth authentication (Google, Facebook)
- JWT token management

### Menu Management (`/api/menu`)
- Menu categories CRUD
- Menu items CRUD
- Category-based item organization

### Order Management (`/api/orders`)
- Order creation and tracking
- Order status updates
- Order history

### Restaurant Management (`/api/restaurants`)
- Multi-tenant restaurant operations
- Restaurant profile management

### Payment Processing (`/api/payments`)
- Stripe payment integration
- Webhook handling for payment events

### User Management (`/api/users`)
- User profile management
- Account settings

### Admin Operations (`/api/admin`)
- Administrative functions
- System management

### Google Services (`/api/google`)
- Google Cloud Storage integration
- File upload handling

### Combo Management (`/api/combos`)
- Combo meal configuration
- Available items management

## 🛠️ Technology Stack

- **Runtime**: Node.js (≥16.0.0)
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with OAuth (Google, Facebook)
- **Payments**: Stripe
- **File Storage**: Google Cloud Storage
- **Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer with Gmail/SMTP
- **Security**: Helmet, CORS, bcryptjs

## 🚀 Quick Start

### Prerequisites
- Node.js (≥16.0.0)
- npm (≥8.0.0)
- PostgreSQL database
- Google Cloud Storage account (optional)
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Restaurants_API
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/restaurant_db
   
   # JWT
   JWT_SECRET=your-secret-key
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   
   # Google Cloud (optional)
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
   ```

4. **Database Setup**
   - Create a PostgreSQL database
   - The application will automatically sync database models on startup

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

Visit the interactive documentation at:
- **Local**: http://localhost:5000/api/docs
- **Production**: https://restaurants-api-d19o.onrender.com/api/docs

The documentation includes:
- Complete endpoint reference
- Request/response schemas
- Authentication examples
- Try-it-out functionality

## 🏗️ Project Structure

```
Restaurants_API/
├── config/
│   ├── database.js         # Database configuration
│   ├── middleware.js       # Express middleware setup
│   └── routes.js          # Route configuration
├── controllers/           # Request handlers
├── models/               # Sequelize database models
├── routes/               # API route definitions
├── services/             # Business logic services
├── utils/                # Utility functions
├── server.js             # Application entry point
├── swagger.js            # API documentation setup
└── package.json          # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes* |
| `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud project ID | No |
| `EMAIL_USER` | Email service username | No |

*Required for payment functionality

### Database Configuration

The application uses PostgreSQL with Sequelize ORM. Models are automatically synced on application startup.

## 🔒 Security

- **Authentication**: JWT tokens with configurable expiration
- **Authorization**: Role-based access control
- **Input Validation**: Request validation and sanitization
- **CORS**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **Password Hashing**: bcryptjs for secure password storage

## 📊 Monitoring

### Health Check
```
GET /api/health
```

Returns system status, version, and available endpoints.

### Logging
- Morgan HTTP request logging
- Error logging with stack traces
- Environment-specific log levels

## 🚀 Deployment

### Render Deployment
The API is deployed on Render with automatic deployments from the main branch.

### Environment Setup
1. Set all required environment variables
2. Configure database connection
3. Set up Google Cloud Storage (if using file uploads)
4. Configure Stripe webhooks

### Production Considerations
- Use production database
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Set up SSL/TLS termination
- Monitor application logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:
- Check the [API Documentation](https://restaurants-api-d19o.onrender.com/api/docs)
- Review the health endpoint: `/api/health`
- Contact the development team

---

**Built with ❤️ for modern restaurant management**