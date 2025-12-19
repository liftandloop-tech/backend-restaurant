import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import User from "../models/user.js";
import KOT from "../models/KOT.js";
import Order from "../models/order.js";


// const jwt = require('jsonwebtoken')
// const {ENV} = require('../config/env.js')
// const User= require('../models/user.js')
// const KOT = require('../models/KOT.js')
// const Order = require('../models/order.js')

export const kitchenSocket = (io, socket) => {
  // Authenticate socket connection
  socket.on("authenticate", async (data, callback) => {
    try {
      const { token } = data;
      
      if (!token) {
        return callback({ success: false, message: "Token required" });
      }
      
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user || !['Owner', 'Admin', 'Manager', 'Kitchen'].includes(user.role)) {
        return callback({ success: false, message: "Unauthorized" });
      }
      
      // Store user info in socket
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      
      // Join kitchen room
      socket.join('kitchen');
      socket.join(`station:${user.role.toLowerCase()}`);
      
      callback({ success: true, message: "Authenticated", role: user.role });
      
      // Notify others in kitchen
      socket.to('kitchen').emit('kitchen:member-joined', {
        userId: socket.userId,
        userName: socket.userName
      });
    } catch (error) {
      callback({ success: false, message: "Authentication failed" });
    }
  });
  
  // Get pending KOTs
  socket.on("kot:get-pending", async () => {
    if (!socket.userId) return;
    
    try {
      const kots = await KOT.find({ 
        station: 'kitchen',
        status: { $in: ['pending', 'preparing'] }
      }).populate('orderId').sort({ createdAt: -1 });
      
      socket.emit("kot:list", kots);
    } catch (error) {
      socket.emit("kot:error", { message: "Failed to fetch KOTs" });
    }
  });
  
  // Update KOT status
  socket.on("kot:update-status", async (data) => {
    if (!socket.userId) return;
    
    try {
      const { kotId, status } = data;
      const kot = await KOT.findByIdAndUpdate(
        kotId,
        { 
          status,
          ...(status === 'preparing' && { startedAt: new Date(), assignedTo: socket.userId }),
          ...(status === 'ready' && { completedAt: new Date() })
        },
        { new: true }
      ).populate('orderId');
      
      if (kot) {
        // Update order status
        if (status === 'ready') {
          await Order.findByIdAndUpdate(kot.orderId, { status: 'ready' });
        }
        
        // Broadcast to kitchen
        io.to('kitchen').emit("kot:updated", kot);
        
        // Broadcast to waiter room
        io.to('waiter').emit("order:ready", { orderId: kot.orderId });
      }
    } catch (error) {
      socket.emit("kot:error", { message: "Failed to update KOT" });
    }
  });
  
  // Handle new order notification
  socket.on("order:new", (data) => {
    if (!socket.userId) return;
    
    // Broadcast to all kitchen stations
    io.to('kitchen').emit("order:new", data);
  });
  
  socket.on("disconnect", () => {
    if (socket.userId) {
      socket.to('kitchen').emit('kitchen:member-left', {
        userId: socket.userId,
        userName: socket.userName
      });
    }
  });
};
