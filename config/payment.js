const { ENV   } =require("./env.js");
const crypto =require("crypto");
const { logger       } =require("../utils/logger.js");

// Payment gateway configuration
exports. paymentConfig = {
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: ENV.PAYMENT_WEBHOOK_SECRET
  },
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: ENV.PAYMENT_WEBHOOK_SECRET
  }
};

// Verify webhook signature (HMAC)
exports. verifyWebhookSignature = (payload, signature, secret) => {
  if (!secret) {
    logger.warn('Webhook secret not configured');
    return false;
  }
  
  try {
    // For Razorpay
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Webhook signature verification failed', error);
    return false;
  }
};

// Verify Razorpay webhook
exports. verifyRazorpayWebhook = (payload, razorpaySignature) => {
  const secret = paymentConfig.razorpay.webhookSecret;
  return verifyWebhookSignature(payload, razorpaySignature, secret);
};

// Verify Stripe webhook
exports. verifyStripeWebhook = (payload, stripeSignature) => {
  const secret = paymentConfig.stripe.webhookSecret;
  
  try {
    const sig = stripeSignature.split(',')[0].split('=')[1];
    const timestamp = stripeSignature.split(',')[1].split('=')[1];
    const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Stripe webhook verification failed', error);
    return false;
  }
};

// Generic payment verification
exports. verifyPayment = (gateway, payload, signature) => {
  switch (gateway) {
    case 'razorpay':
      return verifyRazorpayWebhook(payload, signature);
    case 'stripe':
      return verifyStripeWebhook(payload, signature);
    default:
      logger.warn(`Unknown payment gateway: ${gateway}`);
      return false;
  }
};
