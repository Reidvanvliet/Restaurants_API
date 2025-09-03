# Render Deployment Guide

## Environment Variables Setup

You should have these environment variables configured in your Render service:

### Required Variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Your JWT signing secret
- `NODE_ENV=production`
- `PORT` - Automatically set by Render
- `PLATFORM_DOMAIN=https://restaurants-api-d19o.onrender.com`

### Optional Email Variables (for order confirmations):
- `EMAIL_USER` - Gmail address for development
- `EMAIL_PASS` - Gmail app password for development
- `EMAIL_FROM` - From email address

### Optional Variables:
- `CLIENT_URL` - Frontend URL for CORS
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - Production email service

## Deployment Steps:

1. **Connect Repository**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - Name: `restaurants-api`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Set Environment Variables**
   - Add all variables listed above in the Environment section

4. **Database Setup**
   - Create PostgreSQL database on Render
   - Copy the External Database URL to `DATABASE_URL`

## Current Service URL:
https://restaurants-api-d19o.onrender.com

## API Endpoints:
- Health: `GET /api/health`
- Swagger Docs: `GET /api/docs`
- Auth: `POST /api/auth/login`
- Menu: `GET /api/menu`
- Orders: `POST /api/orders`

## Troubleshooting:

### Common Issues:
1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check database is running and accessible

2. **CORS Issues**
   - Set `CLIENT_URL` to your frontend domain
   - Check CORS middleware configuration

3. **JWT Errors**
   - Ensure `JWT_SECRET` is set and secure
   - Check token expiration settings

4. **Email Service Errors**
   - Email service will be disabled if credentials not set
   - Check email configuration in logs

### Health Check:
```bash
curl https://restaurants-api-d19o.onrender.com/api/health
```

### View Logs:
- Go to Render Dashboard → Your Service → Logs
- Watch for startup messages and errors

## Performance Notes:

- **Free Tier Limitations**: Service spins down after 15 minutes of inactivity
- **Keep-Alive**: Use services like UptimeRobot to ping every 14 minutes
- **Database**: Free PostgreSQL has connection limits

## Security Checklist:

- ✅ `NODE_ENV=production` set
- ✅ Strong `JWT_SECRET` configured  
- ✅ Database URL uses SSL
- ✅ CORS properly configured
- ✅ Helmet middleware enabled