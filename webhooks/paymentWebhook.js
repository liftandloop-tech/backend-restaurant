import { verifyPayment } from "../config/payment.js";
import Payment from "../models/payment.js";
import Bill from "../models/bill.js";
import { logger } from "../utils/logger.js";
import { checkIdempotency, storeIdempotency } from "../utils/idempotency.js";
import mongoose from "mongoose";

// const {verifyPayment} = require('../config/payment.js')
// const Payment = require('../models/payment.js')
// const Bill= require('../models/bill.js')
// const {logger} = require('../utils/logger.js')
// const {checkIdempotency,storeIdempotency} = require('../utils/idempotency.js')
// const mongoose=require("mongoose")


// Handle Razorpay webhook
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = req.body;
    
    if (!signature) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing signature" 
      });
    }
    
    // Verify webhook signature
    const isValid = verifyPayment('razorpay', payload, signature);
    
    if (!isValid) {
      logger.warn('Invalid Razorpay webhook signature', { 
        event: payload.event 
      });
      return res.status(401).json({ 
        success: false, 
        message: "Invalid signature" 
      });
    }
    
    // Check idempotency
    const idempotencyKey = payload.id || payload.event_id;
    if (idempotencyKey) {
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        return res.json({ success: true, message: "Already processed" });
      }
    }
    
    // Process webhook event
    const result = await processPaymentWebhook('razorpay', payload);
    
    // Store idempotency
    if (idempotencyKey) {
      storeIdempotency(idempotencyKey, result);
    }
    
    logger.info('Razorpay webhook processed', { 
      event: payload.event,
      paymentId: result?.paymentId 
    });
    
    res.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    logger.error('Razorpay webhook error', error);
    res.status(500).json({ 
      success: false, 
      message: "Webhook processing failed" 
    });
  }
};

// Handle Stripe webhook
export const handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;
    
    if (!signature) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing signature" 
      });
    }
    
    // Verify webhook signature
    const isValid = verifyPayment('stripe', payload, signature);
    
    if (!isValid) {
      logger.warn('Invalid Stripe webhook signature', { 
        type: payload.type 
      });
      return res.status(401).json({ 
        success: false, 
        message: "Invalid signature" 
      });
    }
    
    // Process webhook event
    const result = await processPaymentWebhook('stripe', payload);
    
    logger.info('Stripe webhook processed', { 
      type: payload.type,
      paymentId: result?.paymentId 
    });
    
    res.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    logger.error('Stripe webhook error', error);
    res.status(500).json({ 
      success: false, 
      message: "Webhook processing failed" 
    });
  }
};

// Process payment webhook event
const processPaymentWebhook = async (gateway, payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    let paymentData = {};
    let paymentId = null;
    
    // Extract payment data based on gateway
    if (gateway === 'razorpay') {
      if (payload.event === 'payment.captured') {
        paymentData = payload.payload.payment.entity;
        paymentId = paymentData.id;
      } else if (payload.event === 'payment.failed') {
        paymentData = payload.payload.payment.entity;
        paymentId = paymentData.id;
      }
    } else if (gateway === 'stripe') {
      if (payload.type === 'payment_intent.succeeded') {
        paymentData = payload.data.object;
        paymentId = paymentData.id;
      } else if (payload.type === 'payment_intent.payment_failed') {
        paymentData = payload.data.object;
        paymentId = paymentData.id;
      }
    }
    
    if (!paymentId) {
      logger.warn('Unknown webhook event', { gateway, payload });
      await session.abortTransaction();
      return { success: false, message: "Unknown event" };
    }
    
    // Find payment by gateway transaction ID
    const payment = await Payment.findOne({ 
      gatewayTransactionId: paymentId 
    }).session(session);
    
    if (!payment) {
      logger.warn('Payment not found for webhook', { paymentId });
      await session.abortTransaction();
      return { success: false, message: "Payment not found" };
    }
    
    // Update payment status
    if (gateway === 'razorpay' && payload.event === 'payment.captured') {
      payment.status = 'completed';
    } else if (gateway === 'razorpay' && payload.event === 'payment.failed') {
      payment.status = 'failed';
    } else if (gateway === 'stripe' && payload.type === 'payment_intent.succeeded') {
      payment.status = 'completed';
    } else if (gateway === 'stripe' && payload.type === 'payment_intent.payment_failed') {
      payment.status = 'failed';
    }
    
    payment.webhookData = payload;
    await payment.save({ session });
    
    // Update bill if payment completed
    if (payment.status === 'completed') {
      const bill = await Bill.findById(payment.billId).session(session);
      if (bill && !bill.paid) {
        bill.paid = true;
        bill.paidAt = new Date();
        await bill.save({ session });
      }
    }
    
    await session.commitTransaction();
    
    return { 
      success: true, 
      paymentId: payment.paymentId,
      status: payment.status 
    };
  } catch (error) {
    await session.abortTransaction();
    logger.error('Payment webhook processing error', error);
    throw error;
  } finally {
    session.endSession();
  }
};

export default { handleRazorpayWebhook, handleStripeWebhook };
//module.exports={handleRazorpayWebhook,handleStripeWebhook}