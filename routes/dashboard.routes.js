const express = require("express");
const dashboardController = require("../controllers/dashboardController.js");
const { authMiddleware } = require("../middlewares/auth.js");
const { requireRoles } = require("../middlewares/roles.js");


const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dashboard routes - Owner, Admin, Manager, and Cashier can access
router.use(requireRoles('Owner', 'Admin', 'Manager', 'Cashier'));

// Get today's summary
router.get("/get/today", dashboardController.getTodaySummary);

// Get sales statistics
router.get("/get/sales", dashboardController.getSalesStatistics);

// Get top selling items
router.get("/get/top-items", dashboardController.getTopSellingItems);

// Get staff performance
router.get("/get/staff", dashboardController.getStaffPerformance);

// Get payment method breakdown
router.get("/get/payments", dashboardController.getPaymentMethodBreakdown);

// Get recent activity
router.get("/get/recent", dashboardController.getRecentActivity);

// Get comprehensive dashboard overview
router.get("/get/overview", dashboardController.getDashboardOverview);

module.exports = router;
