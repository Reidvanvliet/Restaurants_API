const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Order } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/payments/create-intent
// @desc    Create Stripe payment intent
// @access  Public
router.post('/create-intent', async (req, res) => {
  try {
    const { 
      total, 
      customerEmail, 
      customerFirstName, 
      customerLastName,
      orderType 
    } = req.body;

    if (!total || total <= 0) {
      return res.status(400).json({ message: 'Valid total amount is required' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(total) * 100), // Convert to cents
      currency: 'cad', // Canadian dollars
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerEmail: customerEmail || '',
        customerName: `${customerFirstName} ${customerLastName}`,
        orderType: orderType || 'pickup'
      },
      receipt_email: customerEmail || null
    });

    res.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// @route   POST /api/payments/confirm
// @desc    Confirm payment intent
// @access  Public
router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }

    // For demo purposes, we'll assume payment is successful
    // In production, you'd use Stripe webhooks to handle payment confirmation
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      res.json({
        id: paymentIntent.id,
        status: 'succeeded',
        amount: paymentIntent.amount / 100 // Convert back to dollars
      });
    } else {
      res.json({
        id: paymentIntent.id,
        status: paymentIntent.status,
        error: 'Payment not completed'
      });
    }

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// @route   GET /api/payments/status/:paymentIntentId
// @desc    Get payment status
// @access  Public
router.get('/status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Failed to get payment status' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Stripe webhook endpoint
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update order payment status
      await Order.update(
        { paymentStatus: 'paid' },
        { where: { stripePaymentIntentId: paymentIntent.id } }
      );
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Update order payment status
      await Order.update(
        { paymentStatus: 'failed' },
        { where: { stripePaymentIntentId: failedPayment.id } }
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;