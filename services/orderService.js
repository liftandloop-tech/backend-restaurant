import mongoose from "mongoose";
import Order from "../models/order.js";
import { AppError } from "../utils/errorHandler.js";
import Table from "../models/table.js";
import { validateActiveStaffRole } from "./staffService.js";


// const mongoose = require('mongoose')
// const Order= require('../models/order.js')
// const {AppError} = require('../utils/errorHandler')
// const Table = require('../models/table.js')

export const createOrder = async (orderData, userId, userRole) => {
  {/*const{ tableNumber, items, notes, discount,source,customerId}= orderData;*/ }

  const { tableNumber, items, notes, discount, source, customerId, status } = orderData;
  const allowedSources = ['dine-in', 'takeaway', 'phone'];
  const normalizedSource = allowedSources.includes((source || '').toLowerCase())
    ? (source || '').toLowerCase()
    : 'dine-in';



  // validate that active staff can create ordres
  const Staff = (await import('../models/staff.js')).default;


  const User = (await import('../models/user.js')).default;

  let staffMember = null;
  let userMember = null;

  //try to find Staff first
  staffMember = await Staff.findById(userId);

  //if not found as staff, try as user (for owner/admin/manager)
  if (!staffMember) {
    userMember = await User.findById(userId)
    if (!userMember) {
      throw new AppError('user not found with ID: ${userId}.Please contact your administrator', 404)
    }
    // for users (owner/admin/manager), they can always create orders
    // no need to check isActive for users as they manage the system
  } else {
    //for staff members, check if active
    if (!staffMember.isActive) {
      throw new AppError(`Staff member ${staffMember.fullName} is not active. Please contact your manager.`, 403)
    }
  }
  //Validate role permissions for creating orders
  const allowedRoles = ['Waiter', 'Cashier', 'Manager', 'Admin', 'Owner']
  if (!allowedRoles.includes(userRole)) {
    throw new AppError(`Role '${userRole}' does not have permission to create orders`, 403)
  }
  //new for w
  // Validate customer information based on order source
  if (normalizedSource === 'dine-in') {
    // For dine-in orders, customerId is optional (walk-in customers)
    // customerName and customerPhone are not required
  } else if (['takeaway', 'phone', 'online'].includes(normalizedSource)) {
    // For takeaway, phone, and online orders, customerName and customerPhone are required
    if (!orderData.customerName || orderData.customerName.trim() === '') {
      throw new AppError(`Customer name is required for ${normalizedSource} orders`, 400);
    }
    if (!orderData.customerPhone || orderData.customerPhone.trim() === '') {
      throw new AppError(`Customer phone is required for ${normalizedSource} orders`, 400);
    }
  }
  // end
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Calculate discount amount
  let discountAmount = 0;
  if (discount) {
    if (discount.type === "percentage") {
      discountAmount = (subtotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }
    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = subtotalAfterDiscount * 0.05; // 5% GST (2.5% CGST + 2.5% SGST)
  const total = subtotalAfterDiscount + tax;

  // Generate order number before creating order
  // This ensures orderNumber is available before Mongoose validation
  const count = await Order.countDocuments();
  const orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;


  //Determine restaurant from  the user/Staff creating the order
  let restaurantId = null;
  if (userMember && userMember.restaurantId) {
    restaurantId = userMember.restaurantId;
  } else if (staffMember && staffMember.restaurantId) {
    restaurantId = staffMember.restaurantId;
  }
  // new for w
  //Ensure restaurantId is available - try to create/find restaurant if missing
  if (!restaurantId) {
    console.log('No restaurantId found, attempting to ensure user has restaurant', { userId, userRole });

    try {
      const restaurantService = await import('../services/restaurantService.js');
      const restaurant = await restaurantService.ensureUserHasRestaurant(userId);

      if (restaurant && restaurant._id) {
        restaurantId = restaurant._id;
        console.log('Created/found restaurant for user:', restaurantId);

        // Update user's restaurantId if it wasn't set
        if (userMember && !userMember.restaurantId) {
          await User.findByIdAndUpdate(userId, { restaurantId });
        }
      } else {
        throw new Error('Failed to create/find restaurant');
      }
    } catch (restaurantError) {
      console.error('Failed to ensure restaurant for user:', restaurantError);
      throw new AppError('Unable to determine restaurant. Please contact administrator to set up your restaurant.', 400);
    }
  }
  // end
  const newOrderData = {
    orderNumber,
    source: normalizedSource,
    items,
    subtotal,
    discount: discountAmount,
    customerId: customerId || undefined,
    tax,
    total,
    waiterId: userId,
    notes,
    status: status || 'pending',   // new for w
    restaurantId: restaurantId
  };
  //new
  // Only set tableNumber for dine-in and takeaway orders
  // for phone and online oreders ,excplicitly amit tableNumber
  // Only set tableNumber for dine-in and takeaway orders
  // for phone and online orders, explicitly omit tableNumber
  if (normalizedSource === 'dine-in' || normalizedSource === 'takeaway') {
    if (!tableNumber) {
      throw new AppError('Table number is required and must be at least 1 for dine-in and takeaway orders', 400);
    }

    // Verify table exists for dine-in
    if (normalizedSource === 'dine-in') {
      const existingTable = await Table.findOne({
        tableNumber: tableNumber,
        restaurantId: restaurantId
      });

      if (!existingTable) {
        throw new AppError(`Table ${tableNumber} does not exist in this restaurant. Please create the table first or choose a valid table.`, 404);
      }
    }

    newOrderData.tableNumber = tableNumber;
  }

  const order = await Order.create(newOrderData);
  // new for w
  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.incrementRestaurantStat(restaurantId, 'totalOrders');

    // Update average order value
    await restaurantService.updateRestaurantStats(restaurantId);
  } catch (error) {
    console.error('Error updating restaurant stats after order creation:', error);
  }
  // end

  // Update table status and current order only for dine-in and takeaway orders
  if (normalizedSource === 'dine-in' || normalizedSource === 'takeaway') {
    if (restaurantId) {
      const tableUpdateResult = await Table.findOneAndUpdate(
        { tableNumber, restaurantId },
        {
          status: 'serving',
          currentOrderId: order._id
        }
      );
      if (!tableUpdateResult) {
        console.warn(`Table ${tableNumber} not found for restaurant ${restaurantId} during order creation`);
      }
    } else {
      console.warn('Cannot update table status: restaurantId is null');
    }
  }   //end
  //end
//new

  // Deduct inventory stock immediately upon creation
  try {
    const inventoryService = await import('../services/inventoryService.js');
    await inventoryService.deductStockForOrder(order._id);
  } catch (invError) {
    console.error('Failed to deduct inventory for new order:', invError);
    // Continue without failing the order
  }
//end
  return await Order.findById(order._id)
    .populate('waiterId', 'fullName email role')
    .populate('customerId', 'name phone email')
};
// export const getOrders = async (filters = {}, userId, userRole) => {
export const getOrders = async (filters = {}, userId, userRole) => {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.tableNumber) query.tableNumber = filters.tableNumber;
  if (filters.source) query.source = filters.source;
  if (filters.waiterId) query.waiterId = filters.waiterId;
  if (filters.customerId) query.customerId = filters.customerId;
  if (filters.restaurantId) query.restaurantId = filters.restaurantId; // Filter by restaurantId

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }



  // Role -based filtering :Waiter can see only orders they created
  if (userRole === 'Waiter') {
    query.waiterId = userId;
  }
  // other roles (Cashier Manager Admin Owner) can see all orders
  return await Order.find(query)
    // .populate('waiterId', 'fullName email role')
    .populate("waiterId", 'fullName email role')
    .sort({ createdAt: -1 })
    .lean();
};

export const getOrderById = async (orderId, restaurantId) => {
  const query = { _id: orderId };
  if (restaurantId) query.restaurantId = restaurantId;

  const order = await Order.findOne(query)
    .populate('waiterId', 'name email');

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

export const updateOrder = async (orderId, updateData, userId, restaurantId) => {
  const query = { _id: orderId };
  if (restaurantId) query.restaurantId = restaurantId;

  const order = await Order.findOne(query);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // If updating items, recalculate totals
  if (updateData.items) {
    const subtotal = updateData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * 0.05;
    updateData.subtotal = subtotal;
    updateData.tax = tax;
    updateData.total = subtotal + tax;
  }

  Object.assign(order, updateData);
  await order.save();

  return await Order.findById(order._id).populate('waiterId', 'name email');
};

// export const updateOrderStatus = async (orderId, status, userId, userRole) => {
export const updateOrderStatus = async (orderId, status, userId, userRole, restaurantId) => {
  const query = { _id: orderId };
  if (restaurantId) query.restaurantId = restaurantId;

  const order = await Order.findOne(query);

  if (!order) {
    throw new AppError("Order not found", 404);
  }



  // validate that only active staff can update order status 
  // Focus on role-based permissions rather than user existence checks
  const allowedRoles = ['Waiter', 'Cashier', 'Manager', 'Admin', 'Owner']
  if (!allowedRoles.includes(userRole)) {
    throw new AppError(`Role '${userRole}' does not have permission to update order status`, 403)
  }          //new 
  //Role -based status update validation - Complete restaurant workflow: confirmed → preparing → ready → served
  const allowedStatuses = {
    'Waiter': ['draft', 'pending', 'confirmed', 'served'], // Waiters can confirm orders and mark as served after delivery
    'Kitchen': ['confirmed', 'preparing', 'ready'], // Kitchen can update from confirmed to preparing to ready
    'Cashier': ['draft', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed'], // Cashiers can update all statuses  // end
    'Manager': ['draft', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    'Admin': ['draft', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    'Owner': ['draft', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']
  }
  const userAllowedStatuses = allowedStatuses[userRole] || []
  if (!userAllowedStatuses.includes(status)) {
    throw new AppError(`Your role (${userRole}) cannot update orders to '${status}'status`, 403)
  }


  // Additional validation : waiter can only update ordres they created
  if (userRole === 'Waiter' && order.waiterId.toString() !== userId) {
    throw new AppError("Waiter can only update orders they created", 403)
  }

  const oldStatus = order.status
  order.status = status;
  await order.save();

  // Update table status based on order status transitions
  if (order.tableNumber && order.restaurantId) {
    if (status === 'served' && oldStatus !== 'served') {
      // When food is served, mark table as reserved (occupied/eating)
      await Table.findOneAndUpdate(
        { tableNumber: order.tableNumber, restaurantId: order.restaurantId },
        { status: 'reserved' }
      );
    } else if (status === 'completed' && oldStatus !== 'completed') {
      // When order is paid/completed, move table to cleaning
      await Table.findOneAndUpdate(
        { tableNumber: order.tableNumber, restaurantId: order.restaurantId },
        {
          status: 'cleaning',
          $unset: { currentOrderId: 1 }
        }
      );
    }
  }

  return await Order.findById(order._id).populate("waiterId", "fullName email role")
}

export const confirmOrder = async (orderId, userId, userRole, restaurantId) => {
  // validate that only active staff can confirm orders
  const Staff = (await import('../models/staff.js')).default;
  const User = (await import('../models/user.js')).default;

  let staffMember = null;
  let userMember = null;

  // try to find as staff first
  staffMember = await Staff.findById(userId);

  // if not found as staff, try as user (for owner/admin/manager)
  if (!staffMember) {
    userMember = await User.findById(userId);
    if (!userMember) {
      throw new AppError(`User not found with ID: ${userId}`, 404);
    }
    // for users (owner/admin/manager), they can always confirm orders
  } else {
    // for staff members, check if active
    if (!staffMember.isActive) {
      throw new AppError(`Staff member ${staffMember.fullName} is not active. Please contact your manager.`, 403);
    }
  }

  // Validate role permissions for confirming orders (only cashier and above)
  const allowedRoles = ['Cashier', 'Manager', 'Admin', 'Owner'];
  if (!allowedRoles.includes(userRole)) {
    throw new AppError(`Role '${userRole}' does not have permission to confirm orders`, 403);
  }
  //new
  const query = { _id: orderId };
  if (restaurantId) query.restaurantId = restaurantId;

  const order = await Order.findOne(query);
  //end
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Only pending orders can be confirmed
  if (order.status !== 'pending') {
    throw new AppError(`Order with status '${order.status}' cannot be confirmed. Only pending orders can be confirmed.`, 400);
  }

  order.status = 'confirmed';
  order.cashierId = userId; // Track which cashier confirmed the order
  await order.save();
  // new for w
  // Auto-create KOT for kitchen when order is confirmed (if no KOTs exist for this order)
  try {
    const KOT = (await import('../models/KOT.js')).default;
    const existingKOTs = await KOT.find({ orderId: order._id });

    // Only create KOT if none exist for this order
    if (existingKOTs.length === 0 && order.items && order.items.length > 0) {
      const kotCount = await KOT.countDocuments();
      const stationCode = 'KIT'; // Kitchen station
      const kotNumber = `KOT-${stationCode}-${Date.now()}-${String(kotCount + 1).padStart(4, '0')}`;

      // Map order items for KOT
      const kotItems = order.items.map(item => ({
        name: item.name || '',
        qty: item.qty || 0,
        specialInstructions: item.specialInstructions || undefined
      })).filter(item => item.name && item.qty > 0);

      if (kotItems.length > 0) {
        await KOT.create({
          kotNumber,
          orderId: order._id,
          station: 'kitchen',
          items: kotItems,
          status: 'pending',
          restaurantId: order.restaurantId
        });
      }
    }
  } catch (error) {
    console.error('Failed to create KOT on order confirmation:', error);
    // Don't fail the order confirmation if KOT creation fails
  }

  // Deduct inventory stock
  try {
    const inventoryService = await import('../services/inventoryService.js');
    await inventoryService.deductStockForOrder(order._id);
  } catch (error) {
    console.error('Failed to deduct inventory stock:', error);
  }

  // Update table status to 'serving' when order is confirmed
  try {
    await Table.findOneAndUpdate(
      { tableNumber: order.tableNumber, restaurantId: order.restaurantId },
      {
        status: 'serving',
        currentOrderId: order._id
      }
    );
  } catch (error) {
    console.error('Failed to update table status on order confirmation:', error);
    // Don't fail the order confirmation if table update fails
  }

  return await Order.findById(order._id)
    .populate('waiterId', 'fullName email role')
    .populate('customerId', 'name phone email')
};
// new for w
export const getOrdersByStatus = async (status, userId, userRole, restaurantId) => {
  // Validate user permissions
  const allowedRoles = ['Waiter', 'Kitchen', 'Cashier', 'Manager', 'Admin', 'Owner'];
  if (!allowedRoles.includes(userRole)) {
    throw new AppError("You don't have permission to view orders", 403);
  }

  // Build query based on status and user role
  let query = { status };

  // Add restaurantId filter
  if (restaurantId) {
    query.restaurantId = restaurantId;
  }

  // Role-based filtering
  if (userRole === 'Waiter') {
    // Waiters can only see orders they created
    query.waiterId = userId;
  } else if (userRole === 'Kitchen') {
    // Kitchen can see orders that need preparation
    query.status = { $in: ['draft', 'confirmed', 'preparing', 'ready'] };
  } else if (userRole === 'Cashier') {
    // Cashiers can see orders they need to handle
    query.status = { $in: ['pending', 'confirmed', 'completed'] };
  }
  // Managers, Admins, Owners can see all orders

  return await Order.find(query)
    .populate('waiterId', 'fullName email role')
    .populate('cashierId', 'fullName email role')
    .populate('customerId', 'name phone email')
    .sort({ createdAt: -1 })
    .lean();
};
//end
//new
export const cancelOrder = async (orderId, reason, userId, restaurantId) => {
  const query = { _id: orderId };
  if (restaurantId) query.restaurantId = restaurantId;

  const order = await Order.findOne(query);
  //end
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status === 'served' || order.status === 'cancelled') {
    throw new AppError(`Cannot cancel order with status: ${order.status}`, 400);
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelledBy = userId;
  order.cancellationReason = reason;

  await order.save();
  //new
  // Cancel associated KOTs
  try {
    const KOT = (await import('../models/KOT.js')).default;
    await KOT.updateMany(
      { orderId: order._id },
      { $set: { status: 'cancelled' } }
    );
  } catch (kotError) {
    console.error('Failed to cancel KOTs for order:', order._id, kotError);
  }

  // If order was confirmed/serving, free the table?
  // User didn't explicitly ask to free the table on cancel, but "change apply for every users".
  // Valid logic: If order cancelled, table should be 'available' or 'cleaning'.
  // But strictly following user: "if order cancelled so kot should decline or mak deactive".
  // User didn't mention table logic for cancel, only for "served".
  // I will just do KOT cancellation.

  return await Order.findById(order._id).populate('waiterId', 'name email');
};
