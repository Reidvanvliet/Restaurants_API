# Email Configuration Setup

This guide explains how to set up email functionality for order confirmations in the Golden Chopsticks application.

## Prerequisites

The application uses Nodemailer for sending emails. The package has already been installed.

## Environment Variables

You need to configure the following environment variables in your `.env` file:

### For Gmail (Development/Testing)

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=orders@goldenchopsticks.ca
```

### For Production SMTP

```env
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=orders@goldenchopsticks.ca
NODE_ENV=production
```

## Gmail Setup (For Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password (not your regular Gmail password) in `EMAIL_PASS`

3. **Update your `.env` file**:
   ```env
   EMAIL_USER=your-actual-gmail@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM=orders@goldenchopsticks.ca
   ```

## Production Email Services

For production, consider using professional email services:

### SendGrid
```env
NODE_ENV=production
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=orders@goldenchopsticks.ca
```

### AWS SES
```env
NODE_ENV=production
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-access-key-id
SMTP_PASS=your-aws-secret-access-key
EMAIL_FROM=orders@goldenchopsticks.ca
```

### Mailgun
```env
NODE_ENV=production
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-smtp-user
SMTP_PASS=your-mailgun-smtp-password
EMAIL_FROM=orders@goldenchopsticks.ca
```

## Email Template Features

The order confirmation email includes:

- **Professional branding** with Golden Chopsticks styling
- **Complete order details** including items, quantities, and prices
- **Customer information** and delivery/pickup details
- **Payment status** and method
- **Next steps** information (pickup time, delivery ETA)
- **Contact information** for customer support
- **Mobile-responsive design**

## Testing Email Functionality

1. **Set up your email credentials** in `.env`
2. **Start the server**: `npm run dev`
3. **Place a test order** through the frontend
4. **Check the server logs** for email confirmation
5. **Verify the email** was received in the customer's inbox

## Troubleshooting

### Common Issues:

1. **"Invalid login" error with Gmail**:
   - Make sure you're using an App Password, not your regular password
   - Ensure 2FA is enabled on your Google account

2. **Email not sending**:
   - Check server logs for error messages
   - Verify environment variables are set correctly
   - Test the email service connection

3. **Emails going to spam**:
   - Set up proper SPF, DKIM, and DMARC records for your domain
   - Use a professional email service for production
   - Include a clear sender name and address

### Testing Connection

You can test the email service connection by adding this to your server startup:

```javascript
// In server.js, after other initializations
const emailService = require('./services/emailService');
emailService.testConnection();
```

## Security Considerations

1. **Never commit email credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Use App Passwords** instead of regular passwords for Gmail
4. **Consider professional email services** for production
5. **Implement rate limiting** to prevent email abuse

## Email Content Customization

The email template can be customized in `services/emailService.js`:

- **Company branding**: Update colors, logo, and styling
- **Contact information**: Update phone numbers and addresses
- **Additional information**: Add pickup instructions, promotions, etc.
- **Multiple languages**: Add internationalization support

## Monitoring and Analytics

Consider implementing:

- **Email delivery tracking**
- **Open and click rate monitoring**
- **Failed delivery handling**
- **Email queue management** for high volume

## Support

If you encounter issues with email setup:

1. Check the server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test with a simple email service first (like Gmail)
4. Consider using email service webhooks for delivery confirmation