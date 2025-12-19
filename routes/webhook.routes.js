import express from "express";
import { handleRazorpayWebhook, handleStripeWebhook } from "../webhooks/paymentWebhook.js";



// const express = require('express')
// const {handleRazorpayWebhook,handleStripeWebhook} = require('../webhooks/paymentWebhook.js')
// const {generalLimiter} = require('../middlewares/rate-limit.js')

const router = express.Router();

// Webhook routes (no auth, only signature verification)
// Rate limit is less strict for webhooks

router.post("/post/razorpay",express.raw({ type: 'application/json' }),
 // Raw body for signature verification
   handleRazorpayWebhook
);

router.post("/post/stripe",
  express.raw({ type:'application/json' }), // Raw body for signature verification
  handleStripeWebhook);

export default router;

//module.exports = router;
