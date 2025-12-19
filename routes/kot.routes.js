import express from "express";
import * as kotController from "../controllers/kotController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";
import { validate, schemas } from "../middlewares/validation.js";


// const express = require('express')
// const kotController = require('../controllers/kotController.js')
// const{authMiddleware} = require('../middlewares/auth.js')
// const {requireRoles} = require('../middlewares/roles.js')
// const {generalLimiter} = require('../middlewares/rate-limit.js')
// const {validate,schemas}=require('../middlewares/validation.js')

const router = express.Router();

router.use(authMiddleware);

// Create KOT - Cashier and above (cashier print KOT gives to waiter)
router.post( "/post/KOT/cashier",
  requireRoles('Owner', 'Admin', 'Manager', 'Cashier'),
  validate(schemas.kot), kotController.createKOT);
// new 
// Create KOT - Waiter can create KOT when sending order to kitchen
router.post( "/post/KOT/waiter",
  requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter'),
  validate(schemas.kot), kotController.createKOT);

  //Create KOT for order - Cashier and above (Cashier can create KOT for order)
  router.post("/post/order/:orderId/kot", 
     requireRoles('Owner', 'Admin', 'Manager', 'Cashier'),kotController.createKOTForOrder)

// Get KOTs- Kitchen and above (Kitchen staff need to see Kot for preparation)
router.get("/get/KOTs", requireRoles('Owner', 'Admin', 'Manager','Kitchen','Cashier','Waiter'),kotController.getKOTs);

// Get KOT by ID - Kitchen and above (Kitchen staff need kot details
router.get("/get/KOT/by/:id",requireRoles('Owner', 'Admin', 'Manager','Kitchen','Cashier','Waiter'),  kotController.getKOTById);

// Update KOT status - Kitchen and above (Kitchen staff can update status and manager can oversee
router.patch("/update/KOT/:id/status",
  requireRoles('Owner', 'Admin', 'Manager',  'Kitchen','Cashier','Waiter'),
  kotController.updateKOTStatus);

// Mark KOT as printed - cashier print KOTs,kitchen mark kot as printed
router.post("/post/KOT/:id/print",
  requireRoles('Owner', 'Admin', 'Manager','Cashier','Kitchen'),kotController.markKOTPrinted);
//new
// Get KOTs by status (for different roles to see their relevant KOTs)
router.get("/get/KOTs/status/:status", 
  requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Kitchen','Waiter'),
  kotController.getKOTsByStatus);

// Get KOTs for a specific order
router.get("/get/order/:orderId/kots", 
  requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Kitchen', 'Waiter'),
  kotController.getKOTsForOrder);

// Update KOT items (for kitchen to mark items as prepared)
router.patch("/patch/KOT/:id/items", 
  requireRoles('Owner', 'Admin', 'Manager', 'Kitchen'),
  kotController.updateKOTItems);

export default router;
//module.exports=router
