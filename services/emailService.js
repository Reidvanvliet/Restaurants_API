const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Check what email credentials are available
      const hasSMTPCredentials = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
      const hasEmailCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;

      if (!hasSMTPCredentials && !hasEmailCredentials) {
        console.warn('⚠️  Email credentials not configured. Email functionality will be disabled.');
        this.transporter = null;
        return;
      }

      // Prefer SMTP credentials if available, fallback to EMAIL credentials
      if (hasSMTPCredentials) {
        // Use SMTP configuration (production or custom SMTP server)
        console.log('📧 Using SMTP configuration');
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        // Fallback to EMAIL credentials (Gmail or other service)
        console.log('📧 Using EMAIL credentials (Gmail service)');
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      }

      console.log('📧 Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.transporter = null;
    }
  }

  async sendOrderConfirmation(orderData, restaurant = null) {
    try {
      // Skip if email service is not configured
      if (!this.transporter) {
        console.warn('⚠️  Email service not configured. Skipping email send.');
        return { messageId: 'skipped-no-config' };
      }

      // Use restaurant data if provided, otherwise fallback to defaults
      const restaurantName = restaurant?.name || 'Golden Chopsticks';
      const restaurantEmail = restaurant?.contactInfo?.email || process.env.EMAIL_FROM || process.env.EMAIL_USER;

      const emailContent = this.generateOrderConfirmationEmail(orderData, restaurant);
      
      const mailOptions = {
        from: `"${restaurantName}" <${restaurantEmail}>`,
        to: orderData.customerEmail,
        subject: `Order Confirmation #${orderData.id} - ${restaurantName}`,
        html: emailContent.html,
        text: emailContent.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Order confirmation email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Error sending order confirmation email:', error);
      throw error;
    }
  }

  parseOrderItem(item) {
    try {
      // Check if itemName contains JSON combo data
      const comboData = JSON.parse(item.itemName);
      if (comboData.type === 'combo') {
        return {
          ...item,
          isCombo: true,
          displayName: comboData.originalName,
          comboData: comboData,
          quantity: item.quantity,
          price: item.price
        };
      }
    } catch (e) {
      // Not JSON, treat as regular item
    }
    return {
      ...item,
      isCombo: false,
      displayName: item.itemName,
      quantity: item.quantity,
      price: item.price
    };
  }

  generateOrderConfirmationEmail(order, restaurant = null) {
    // Extract restaurant info with fallbacks
    const restaurantName = restaurant?.name || 'Golden Chopsticks';
    const restaurantPhone = restaurant?.contactInfo?.phone || '(250) 555-0123';
    const restaurantEmail = restaurant?.contactInfo?.email || 'orders@goldenchopsticks.ca';
    const restaurantAddress = restaurant?.contactInfo?.address || '123 Main Street, West Kelowna, BC';
    const primaryColor = restaurant?.themeColors?.primary || '#f59e0b';
    const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsHtml = order.items.map(item => {
      const parsedItem = this.parseOrderItem(item);
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            ${parsedItem.quantity}x ${parsedItem.displayName}
            ${parsedItem.isCombo ? '<span style="background: #dc2626; color: white; font-size: 11px; padding: 2px 6px; border-radius: 3px; margin-left: 8px;">COMBO</span>' : ''}
            ${parsedItem.isCombo && parsedItem.comboData ? `
              <div style="font-size: 12px; color: #666; margin-top: 4px; padding-left: 16px;">
                ${parsedItem.comboData.baseChoice ? '• Base: Chicken Chow Mein or Chicken Fried Rice<br>' : ''}
                ${parsedItem.comboData.selectedItems && parsedItem.comboData.selectedItems.length > 0 ? `• ${parsedItem.comboData.selectedItems.length} selected entree${parsedItem.comboData.selectedItems.length > 1 ? 's' : ''}<br>` : ''}
                ${parsedItem.comboData.additionalItems && parsedItem.comboData.additionalItems.length > 0 ? `• ${parsedItem.comboData.additionalItems.length} additional item${parsedItem.comboData.additionalItems.length > 1 ? 's' : ''}<br>` : ''}
                ${[2, 3, 4, 5, 6, 7].includes(parsedItem.comboData.comboId) ? `• ${parsedItem.comboData.comboId === 2 ? '2' : parsedItem.comboData.comboId === 3 ? '3' : parsedItem.comboData.comboId === 4 ? '4' : parsedItem.comboData.comboId === 5 ? '6' : parsedItem.comboData.comboId === 6 ? '8' : '10'} Spring Roll${parsedItem.comboData.comboId === 2 ? 's' : 's'} (included)` : ''}
              </div>
            ` : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
            $${Number(parsedItem.price * parsedItem.quantity).toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    const itemsText = order.items.map(item => {
      const parsedItem = this.parseOrderItem(item);
      let itemText = `${parsedItem.quantity}x ${parsedItem.displayName}`;
      
      if (parsedItem.isCombo) {
        itemText += ' [COMBO]';
        if (parsedItem.comboData) {
          if (parsedItem.comboData.baseChoice) {
            itemText += '\n   • Base: Chicken Chow Mein or Chicken Fried Rice';
          }
          if (parsedItem.comboData.selectedItems && parsedItem.comboData.selectedItems.length > 0) {
            itemText += `\n   • ${parsedItem.comboData.selectedItems.length} selected entree${parsedItem.comboData.selectedItems.length > 1 ? 's' : ''}`;
          }
          if (parsedItem.comboData.additionalItems && parsedItem.comboData.additionalItems.length > 0) {
            itemText += `\n   • ${parsedItem.comboData.additionalItems.length} additional item${parsedItem.comboData.additionalItems.length > 1 ? 's' : ''}`;
          }
          if ([2, 3, 4, 5, 6, 7].includes(parsedItem.comboData.comboId)) {
            const springRolls = parsedItem.comboData.comboId === 2 ? '2' : parsedItem.comboData.comboId === 3 ? '3' : parsedItem.comboData.comboId === 4 ? '4' : parsedItem.comboData.comboId === 5 ? '6' : parsedItem.comboData.comboId === 6 ? '8' : '10';
            itemText += `\n   • ${springRolls} Spring Rolls (included)`;
          }
        }
      }
      
      itemText += ` - $${Number(parsedItem.price * parsedItem.quantity).toFixed(2)}`;
      return itemText;
    }).join('\n');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - ${restaurantName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); color: black; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🥢 ${restaurantName}</h1>
        <p style="margin: 10px 0 0 0; font-size: 18px;">Order Confirmation</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #dc2626; margin-top: 0;">Thank you for your order!</h2>
        
        <p>Hi ${order.customerFirstName},</p>
        <p>We've received your order and are preparing your delicious meal. Here are the details:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc2626;">Order Details</h3>
          <p><strong>Order #:</strong> ${order.id}</p>
          <p><strong>Order Date:</strong> ${formattedDate}</p>
          <p><strong>Order Type:</strong> ${order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}</p>
          ${order.orderType === 'delivery' ? `<p><strong>Delivery Address:</strong> ${order.customerAddress}</p>` : ''}
          <p><strong>Phone:</strong> ${order.customerPhone}</p>
          ${order.notes ? `<p><strong>Special Instructions:</strong> ${order.notes}</p>` : ''}
        </div>
        
        <h3 style="color: #dc2626;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #dc2626;">Item</th>
              <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dc2626;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%;">
            <tr>
              <td><strong>Subtotal:</strong></td>
              <td style="text-align: right;"><strong>$${Number(order.subtotal).toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td><strong>Tax:</strong></td>
              <td style="text-align: right;"><strong>$${Number(order.tax).toFixed(2)}</strong></td>
            </tr>
            ${order.deliveryFee > 0 ? `
            <tr>
              <td><strong>Delivery Fee:</strong></td>
              <td style="text-align: right;"><strong>$${Number(order.deliveryFee).toFixed(2)}</strong></td>
            </tr>
            ` : ''}
            <tr style="border-top: 2px solid #dc2626; font-size: 18px;">
              <td><strong>Total:</strong></td>
              <td style="text-align: right;"><strong>$${Number(order.total).toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
          <h3 style="margin-top: 0; color: #1976d2;">What's Next?</h3>
          ${order.orderType === 'pickup' ? `
            <p><strong>Pickup:</strong> Your order will be ready in 15-20 minutes. We'll call you when it's ready!</p>
            <p><strong>Location:</strong> ${restaurantAddress}</p>
          ` : `
            <p><strong>Delivery:</strong> Your order will be delivered in 30-45 minutes.</p>
            <p>Our driver will call you when they arrive.</p>
          `}
          <p><strong>Payment:</strong> ${order.paymentStatus === 'paid' ? 'Paid online' : `${order.paymentMethod.replace('_', ' ')} on ${order.orderType}`}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            Questions about your order? Call us at <strong>${restaurantPhone}</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Thank you for choosing ${restaurantName}!<br>
            We appreciate your business and look forward to serving you again.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
${restaurantName} - Order Confirmation

Thank you for your order, ${order.customerFirstName}!

Order Details:
- Order #: ${order.id}
- Order Date: ${formattedDate}
- Order Type: ${order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}
${order.orderType === 'delivery' ? `- Delivery Address: ${order.customerAddress}` : ''}
- Phone: ${order.customerPhone}
${order.notes ? `- Special Instructions: ${order.notes}` : ''}

Order Items:
${itemsText}

Order Summary:
- Subtotal: $${Number(order.subtotal).toFixed(2)}
- Tax: $${Number(order.tax).toFixed(2)}
${order.deliveryFee > 0 ? `- Delivery Fee: $${Number(order.deliveryFee).toFixed(2)}` : ''}
- Total: $${Number(order.total).toFixed(2)}

What's Next?
${order.orderType === 'pickup' ? `
Your order will be ready for pickup in 15-20 minutes. We'll call you when it's ready!
Location: ${restaurantAddress}
` : `
Your order will be delivered in 30-45 minutes. Our driver will call you when they arrive.
`}
Payment: ${order.paymentStatus === 'paid' ? 'Paid online' : `${order.paymentMethod.replace('_', ' ')} on ${order.orderType}`}

Questions? Call us at ${restaurantPhone} or email ${restaurantEmail}

Thank you for choosing ${restaurantName}!
    `;

    return { html, text };
  }

  async testConnection() {
    try {
      if (!this.transporter) {
        console.warn('⚠️  Email service not configured. Cannot test connection.');
        return false;
      }
      
      await this.transporter.verify();
      console.log('📧 Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();