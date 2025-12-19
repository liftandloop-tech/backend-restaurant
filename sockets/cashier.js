import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import User from "../models/user.js";
import Bill from "../models/bill.js";
import Order from "../models/order.js";

// const jwt = require('jsonwebtoken')
// const {ENV} = require('../config/db.js')
// const User= require('../models/user.js')
// const Bill = require('../models/bill.js')
// const Order = require('../models/order.js')



export const cashierSocket = (io, socket) => {
  // Authenticate socket connection
  socket.on("authenticate", async (data, callback) => {
    try {
      const { token } = data;
      
      if (!token) {
        return callback({ success: false, message: "Token required" });
      }
      
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user || !['Owner', 'Admin', 'Manager', 'Cashier'].includes(user.role)) {
        return callback({ success: false, message: "Unauthorized" });
      }
      
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      
      // Join cashier room
      socket.join('cashier');
      socket.join(`cashier:${socket.userId}`);
      
      callback({ success: true, message: "Authenticated", role: user.role });
    } catch (error) {
      callback({ success: false, message: "Authentication failed" });
    }
  });
  
  // Get pending bills
  socket.on("bill:get-pending", async () => {
    if (!socket.userId) return;
    
    try {
      const bills = await Bill.find({ paid: false })
        .populate('orderId')
        .sort({ createdAt: -1 });
      
      socket.emit("bill:list", bills);
    } catch (error) {
      socket.emit("bill:error", { message: "Failed to fetch bills" });
    }
  });
  
  // Notify bill created
  socket.on("bill:created", async (data) => {
    if (!socket.userId) return;
    
    try {
      const { billId } = data;
      const bill = await Bill.findById(billId)
        .populate('orderId')
        .populate('cashierId', 'name');
      
      if (bill) {
        // Broadcast to all cashiers
        io.to('cashier').emit("bill:new", bill);
      }
    } catch (error) {
      socket.emit("bill:error", { message: "Failed to notify bill" });
    }
  });
  
  // Notify payment processed
  socket.on("bill:payment-processed", async (data) => {
    if (!socket.userId) return;
    
    try {
      const { billId, paymentMethod, amount } = data;
      const bill = await Bill.findById(billId)
        .populate('orderId')
        .populate('cashierId', 'name');
      
      if (bill) {
        // Broadcast to all cashiers
        io.to('cashier').emit("bill:paid", {
          bill,
          paymentMethod,
          amount,
          processedBy: socket.userName
        });
        
        // Notify managers for reporting
        io.to('manager').emit("payment:completed", {
          billId: bill._id,
          amount,
          paymentMethod,
          timestamp: new Date()
        });
      }
    } catch (error) {
      socket.emit("bill:error", { message: "Failed to notify payment" });
    }
  });
  
  // Get daily summary
  socket.on("cashier:daily-summary", async () => {
    if (!socket.userId) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const bills = await Bill.find({
        createdAt: { $gte: today },
        paid: true
      }).populate('orderId');
      
      const summary = {
        totalBills: bills.length,
        totalRevenue: bills.reduce((sum, bill) => sum + bill.total, 0),
        byPaymentMethod: bills.reduce((acc, bill) => {
          acc[bill.paymentMethod] = (acc[bill.paymentMethod] || 0) + bill.total;
          return acc;
        }, {})
      };
      
      socket.emit("cashier:summary", summary);
    } catch (error) {
      socket.emit("cashier:error", { message: "Failed to generate summary" });
    }
  });
  
  socket.on("disconnect", () => {
    // Clean up on disconnect
  });
};
