const express = require("express");
const { handleRazorpayWebhook, handleStripeWebhook } = require("../webhooks/paymentWebhook.js");



const router = express.Router();

// Webhook routes (no auth, only signature verification)
// Rate limit is less strict for webhooks

router.post("/post/razorpay", express.raw({ type: 'application/json' }),
  // Raw body for signature verification
  handleRazorpayWebhook
);

router.post("/post/stripe",
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  handleStripeWebhook);

module.exports = router;
