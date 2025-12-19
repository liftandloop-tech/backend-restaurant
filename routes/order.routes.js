import express from "express";
import * as orderController from "../controllers/orderController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";
import { validate, schemas } from "../middlewares/validation.js";



// const express = require('express')
// const orderController = require('../controllers/orderController.js')
// const{authMiddleware} = require('../middlewares/auth.js')
// const {requireRoles} = require('../middlewares/roles.js')
// const {generalLimiter} = require('../middlewares/rate-limit.js')
// const {validate,schemas} = require('../middlewares/validation.js')

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create order -  Waiter Cashier and above (Waiter take ordres and cashier handle quick orders)
router.post( "/post/order", 
  requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter'),
  validate(schemas.order), orderController.createOrder);

// Get orders - All authenticated users(filtered by role in controller)
router.get( "/get/order",  requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter','Kitchen'),orderController.getOrders);

// Get order by ID -All authenticated users(filtered by role in controller)
router.get( "/get/order/by/:id",requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter','Kitchen'),orderController.getOrderById);

// Update order - Waiter, Cashier and above(Waiter can modify orders they cretated)
router.put( "/update/order/by/:id", 
  requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter'),
  validate(schemas.updateOrder), orderController.updateOrder);

// Update order status - role specifice permissions
// Cashier: confirm order,Waiter:served order,Kitchen: preparing/ready,cashier completed manager all
router.patch("/patch/order/by/:id/status",requireRoles('Owner', 'Admin', 'Manager', 'Waiter', 'Kitchen','Cashier'),
  orderController.updateOrderStatus);

  //Confirm order -  (Cashier  confirm order befor processing)
router.patch("/patch/order/by/:id/confirm",  requireRoles('Owner', 'Admin', 'Manager', 'Cashier'),orderController.confirmOrder)
// Cancel order - Waiter,Cashier and above(Waiter can cancle order they created)
router.post( "/post/order/by/:id/cancel", 
  requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter'),
  orderController.cancelOrder);

  
//Get order by status - for workflow management
  router.get("/get/order/status/:status", requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter','Kitchen'),orderController.getOrdersByStatus)
export default router;
//module.exports= router
