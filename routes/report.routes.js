import express from "express";
import * as reportController from "../controllers/reportController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";


import { validate, schemas } from "../middlewares/validation.js";


// const express = require('express')
// const reportController = require('../controllers/reportController.js')
// const{authMiddleware} = require('../middlewares/auth.js')
// const {requireRoles} = require('../middlewares/roles.js')
// const {generalLimiter} = require('../middlewares/rate-limit.js')
// const {validate,schemas} = require('../middlewares/validation.js')

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);
// new 
// Export PDF - All authenticated users can export
router.get("/export/pdf", reportController.exportPDF);

// Get Dashboard Stats
router.get("/dashboard-stats", reportController.getDashboardStats);

// Schedule Report routes - All authenticated users can schedule
router.post("/schedule", validate(schemas.scheduledReport),
  reportController.createScheduledReport, requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter'),);

router.get("/schedule", reportController.getScheduledReports);

router.put("/schedule/:id",
  reportController.updateScheduledReport);

router.delete("/schedule/:id", reportController.deleteScheduledReport);

export default router;
//module.exports=router;
// end