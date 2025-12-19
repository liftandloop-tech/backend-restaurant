import mongoose from "mongoose";
import Bill from "../models/bill.js";
import Payment from "../models/payment.js";
import Order from "../models/order.js";
import User from "../models/user.js";
import { AppError } from "../utils/errorHandler.js";
import { checkIdempotency, storeIdempotency } from "../utils/idempotency.js";
import * as restaurantService from "./restaurantService.js";


// const mongoose = require('mongoose')
// const Bill = require('../models/bill.js')
// const {AppError} = require('../utils/errorHandler.js')
// const payment = require('../models/payment.js')
// const Order = require('../models/order.js')
// const {checkIdempotency,storeIdempotency} = require('../utils/idempotency.js')


  export const createBill = async (orderId, cashierId, idempotencyKey,cashierRole) => {
  //const order = await Order.findById(orderId).populate('customerId', 'name phone email');
  const order = await Order.findById(orderId).populate('customerId','name email phone')

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== 'served') {
    throw new AppError("Order must be served before billing", 400);
  }

  //new for w
       //Validate that only active cashier/manager can create bills
       const Staff = (await import('../models/staff.js')).default
       const User = (await import('../models/user.js')).default

       let cashier = null;
       let user = null;

       // Try to find as staff first
       cashier = await Staff.findById(cashierId);

       // If not found as staff, try as user (for manager/admin/owner)
       if(!cashier){
         user = await User.findById(cashierId);
         if(!user){
           throw new AppError(`Staff/User not found with ID: ${cashierId}`, 404);
         }
       }else{
         // For staff members, check if active
         if(!cashier.isActive){
           throw new AppError(`Staff member ${cashier.fullName} is not active. Please contact your manager.`, 403);
         }
       }

       // Validate role permissions for creating bills
       const allowedRoles = ['Cashier', 'Manager', 'Admin', 'Owner'];
       if(!allowedRoles.includes(cashierRole)) {
         throw new AppError(`Role '${cashierRole}' does not have permission to create bills`, 403);
       }
       // end
  // Check if bill already exists
  const existingBill = await Bill.findOne({ orderId });
  if (existingBill) {
    return existingBill;
  }
  
  if(idempotencyKey){
const existingBillBykey =await Bill.findOne({idempotencyKey});
if(existingBillBykey){
  return await Bill.findById(existingBillBykey._id)
  .populate('orderId')
  //.populate('customerId', 'name phone email') // Include customer information
  .populate('customerId, name email phone') //include customer information
  .populate('cashierId','name email')
 }
}   //new for w
    // Determine restaurantId from the order or cashier
    let restaurantId = null;
    if (order.restaurantId) {
      restaurantId = order.restaurantId;
    } else if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else if (cashier && cashier.restaurantId) {
      restaurantId = cashier.restaurantId;
    }
// end
try{
    const bill = await Bill.create({
    orderId,
    //customerId: order.customerId || null, // Include customer ID from order
   customerId: order.customerId || null, //include customer id from order
    subtotal: order.subtotal,
    tax: order.tax,
    discount: 0,
    total: order.total,
    cashierId,
    restaurantId: restaurantId,
    idempotencyKey:idempotencyKey||null
  });


    const populatedBill = await Bill.findById(bill._id)
    // new for w
    .populate('orderId', 'orderNumber tableNumber source items subtotal tax discount total customerName customerPhone customerEmail deliveryAddress deliveryPhone deliveryTime')
    .populate('customerId','name email phone') //Include customer infromation
    .populate('cashierId','fullName email role')
    return populatedBill
}catch(error){
  if(error.code===11000&& error.keyPattern.idempotencyKey){
    const existingBillBykey= await Bill.findOne({idempotencyKey})
    if(existingBillBykey){
      return await Bill.findById(existingBillBykey._id)
      // new for w only one
      .populate('orderId', 'orderNumber tableNumber source items subtotal tax discount total customerName customerPhone customerEmail deliveryAddress deliveryPhone deliveryTime')
      .populate('customerId','name email phone')
      .populate('cashierId','fullName email role')
    }
  }
throw error
}
  };

export const processPayment = async (billId, paymentData, cashierId, idempotencyKey) => {
  // Check idempotency
  const cached = checkIdempotency(idempotencyKey);
  if (cached) {
    return cached;
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const bill = await Bill.findById(billId).session(session);
    
    if (!bill) {
      throw new AppError("Bill not found", 404);
    }
    
    if (bill.paid) {
      throw new AppError("Bill already paid", 400);
    }
    
    const { paymentMethod, transactionId, gatewayResponse } = paymentData;
    
    // Create payment record
    const payment = await Payment.create([{
      billId: bill._id,
      orderId: bill.orderId,
      amount: bill.total,
      mode: paymentMethod,
      status: paymentMethod === 'cash' ? 'completed' : 'processing',
      gatewayTransactionId: transactionId,
      gatewayResponse,
      idempotencyKey,
      processedBy: cashierId
    }], { session });
    
    // Update bill
    bill.paid = true;
    bill.paidAt = new Date();
    bill.paymentMethod = paymentMethod;
    bill.transactionId = transactionId || payment[0].paymentId;
    await bill.save({ session });
    
    // Update order status if needed
    await Order.findByIdAndUpdate(
      bill.orderId,
      { status: 'completed' },
      { session }
    );
// new for w
    // Add bill amount to restaurant account
    try {
      // Use the restaurantId from the bill if available
      let restaurantIdToUpdate = bill.restaurantId;

      // If no restaurantId on bill, try to find it from the order
      if (!restaurantIdToUpdate && bill.orderId && bill.orderId.restaurantId) {
        restaurantIdToUpdate = bill.orderId.restaurantId;
      }

      // If still no restaurantId, try to find from cashier
      if (!restaurantIdToUpdate) {
        const cashier = await User.findById(cashierId).session(session);
        if (cashier && cashier.restaurantId) {
          restaurantIdToUpdate = cashier.restaurantId;
        }
      }

      if (restaurantIdToUpdate) {
        await restaurantService.addBillToRestaurantAccount(restaurantIdToUpdate, bill.total, bill._id);
      } else {
        console.warn('Could not determine restaurant ID for bill payment:', bill._id);
      }
    } catch (restaurantError) {
      // Don't fail the payment if restaurant account update fails
      console.error('Failed to update restaurant account:', restaurantError);
    }
// end
    await session.commitTransaction();
    
    const result = {
      bill: await Bill.findById(bill._id).populate('orderId').populate('cashierId', 'name email'),
      payment: payment[0]
    };
    
    // Store idempotency
    storeIdempotency(idempotencyKey, result);
    
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getBills = async (filters = {}) => {
  const query = {};
  
  if (filters.paid !== undefined) query.paid = filters.paid;
  if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
  if (filters.cashierId) query.cashierId = filters.cashierId;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  
  return await Bill.find(query)
    .populate('orderId')
    .populate('cashierId', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

export const getBillById = async (billId) => {
  const bill = await Bill.findById(billId)
    .populate('orderId', 'orderNumber tableNumber items subtotal tax discount total')
    .populate('cashierId', 'name email');

  if (!bill) {
    throw new AppError("Bill not found", 404);
  }

  return bill;
};

export const getBillsByCashier = async (cashierId, cashierRole) => {
  // Validate permissions
  const allowedRoles = ['Cashier', 'Manager', 'Admin', 'Owner'];
  if (!allowedRoles.includes(cashierRole)) {
    throw new AppError("You don't have permission to view bills", 403);
  }

  let query = {};

  // Cashiers can only see bills they created
  if (cashierRole === 'Cashier') {
    query.cashierId = cashierId;
  }
  // Managers, Admins, Owners can see all bills

  return await Bill.find(query)
    .populate('orderId', 'orderNumber tableNumber total status')
    .populate('cashierId', 'fullName email role')
    .sort({ createdAt: -1 })
    .lean();
};

export const processRefund = async (billId, refundAmount, reason, cashierId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bill = await Bill.findById(billId).session(session);

    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    if (!bill.paid) {
      throw new AppError("Cannot refund unpaid bill", 400);
    }

    if (refundAmount > bill.total) {
      throw new AppError("Refund amount cannot exceed bill total", 400);
    }

    // Update payment
    const payment = await Payment.findOne({ billId: bill._id }).session(session);
    if (payment) {
      payment.refunded = true;
      payment.refundedAt = new Date();
      payment.refundAmount = refundAmount;
      await payment.save({ session });
    }

    // Update bill
    bill.refunded = true;
    bill.refundedAt = new Date();
    bill.refundAmount = refundAmount;
    await bill.save({ session });

    await session.commitTransaction();

    return await Bill.findById(bill._id)
      .populate('orderId')
      .populate('cashierId', 'name email');
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

