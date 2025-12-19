import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import User from "../models/user.js";
import Order from "../models/order.js";

// const jwt = require('jsonwebtoken')
// const {ENV} = require('../config/db.js')
// const User= require('../models/user.js')
// const Order = require('../models/order.js')

export const waiterSocket = (io, socket) => {
  // Authenticate socket connection
  socket.on("authenticate", async (data, callback) => {
    try {
      const { token } = data;
      
      if (!token) {
        return callback({ success: false, message: "Token required" });
      }
      
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user || !['Owner', 'Admin', 'Manager', 'Waiter'].includes(user.role)) {
        return callback({ success: false, message: "Unauthorized" });
      }
      
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      
      // Join waiter room and personal room
      socket.join('waiter');
      socket.join(`waiter:${socket.userId}`);
      
      callback({ success: true, message: "Authenticated", role: user.role });
    } catch (error) {
      callback({ success: false, message: "Authentication failed" });
    }
  });
  
  // Get waiter's orders
  socket.on("order:get-my-orders", async () => {
    if (!socket.userId) return;
    
    try {
      const orders = await Order.find({ 
        waiterId: socket.userId,
        status: { $nin: ['cancelled', 'completed'] }
      }).sort({ createdAt: -1 });
      
      socket.emit("order:list", orders);
    } catch (error) {
      socket.emit("order:error", { message: "Failed to fetch orders" });
    }
  });
  
  // Notify order placed
  socket.on("order:placed", async (data) => {
    if (!socket.userId) return;
    
    try {
      const { orderId } = data;
      const order = await Order.findById(orderId).populate('waiterId', 'name');
      
      if (order) {
        // Notify kitchen
        io.to('kitchen').emit("order:new", order);
        
        // Notify all waiters
        io.to('waiter').emit("order:update", order);
      }
    } catch (error) {
      socket.emit("order:error", { message: "Failed to notify order" });
    }
  });
  
  // Update order status (waiter actions)
  socket.on("order:update-status", async (data) => {
    if (!socket.userId) return;
    
    try {
      const { orderId, status } = data;
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      
      if (order) {
        // Broadcast to relevant rooms
        io.to('waiter').emit("order:update", order);
        
        if (status === 'served') {
          io.to('cashier').emit("order:ready-for-billing", order);
        }
      }
    } catch (error) {
      socket.emit("order:error", { message: "Failed to update order" });
    }
  });
  
  // Request table assistance
  socket.on("table:assistance", (data) => {
    if (!socket.userId) return;
    
    const { tableNumber } = data;
    
    // Notify managers
    io.to('manager').emit("table:assistance-request", {
      tableNumber,
      waiterId: socket.userId,
      waiterName: socket.userName,
      timestamp: new Date()
    });
  });
  
  socket.on("disconnect", () => {
    // Clean up on disconnect
  });
};
