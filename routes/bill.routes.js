import express from "express";
import * as billController from "../controllers/billController.js";
import { authMiddleware } from "../middlewares/auth.js";
import {  requireRoles,} from "../middlewares/roles.js";
import { validate, schemas } from "../middlewares/validation.js";
import  ROLES  from "../middlewares/roles.js";

// const express = require('express')
// const billController = require('../controllers/billController.js')
// const{authMiddleware} = require('../middlewares/auth.js')
// const {requireRoles} = require('../middlewares/roles.js')
// const {generalLimiter} = require('../middlewares/rate-limit.js')
// const {validate,schemas}=require('../middlewares/validation.js')
// const {paymentLimiter,generalLimiter}=require('../middlewares/rate-limit.js')

const router = express.Router();

router.use(authMiddleware);

// Create bill - Cashier and above(Cashier handle billing)
router.post("/post/order/:orderId",  requireRoles('Owner', 'Admin', 'Manager', 'Cashier'),billController.createBill);

// Process payment - Cashier and above(Cashier handle payments)
router.post("/post/:billId/payment",requireRoles('Owner', 'Admin', 'Manager', 'Cashier'),validate(schemas.bill),billController.processPayment);

// Get bills - Cashier and above(Cashier need to view bills for payment processing)
router.get("/get/bill",requireRoles('Owner', 'Admin', 'Manager', 'Cashier'),billController.getBills);

// Get bill by ID - Cashier and above(Cashier need bill details for payment processing)
router.get("/get/bill/by/:id",requireRoles('Owner', 'Admin', 'Manager', 'Cashier'),billController.getBillById);

// Process refund - Manager and above(Only manager handle refunds for control)
router.post("/post/:billId/refund",requireRoles('Owner', 'Admin', 'Manager',),billController.processRefund);

// Print bill - Cashier and above(Cashier print bills for customers)
router.get("/get/:billId/print",requireRoles('Owner','Admin','Manager','Cashier'),billController.printBill);



// Get bills by cashier - Cashiers can see bills they created
router.get("/get/bills/cashier/:cashierId",requireRoles('Owner','Admin','Manager','Cashier'),billController.getBillsByCashier)
export default router;
//module.exports=router;
