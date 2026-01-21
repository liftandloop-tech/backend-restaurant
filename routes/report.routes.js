const express = require("express");
const reportController = require("../controllers/reportController.js");
const { authMiddleware } = require("../middlewares/auth.js");
const { requireRoles } = require("../middlewares/roles.js");
const { validate, schemas } = require("../middlewares/validation.js")
// totalnew
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
  requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter'),
  reportController.createScheduledReport);

router.get("/schedule", reportController.getScheduledReports);

router.put("/schedule/:id",
  reportController.updateScheduledReport);

// Generate and Save Report Snapshot
router.post("/generate", requireRoles('Owner', 'Admin', 'Manager'), reportController.generateAndSaveReport);

// Get Archived Reports History
router.get("/history", requireRoles('Owner', 'Admin', 'Manager'), reportController.getArchivedReports);

router.delete("/schedule/:id", reportController.deleteScheduledReport);

// Specific Report Components Endpoints (Owner Only)
const reportHandler = (type) => (req, res, next) => {
  req.query.reportType = type;
  reportController.getDashboardStats(req, res, next);
};

router.get("/order", requireRoles('Owner', 'Admin'), reportHandler('order'));
router.get("/customer", requireRoles('Owner', 'Admin'), reportHandler('customer'));
router.get("/revenue", requireRoles('Owner', 'Admin'), reportHandler('billing')); // Revenue is usually part of billing/sales
router.get("/staff", requireRoles('Owner', 'Admin'), reportHandler('staff'));
router.get("/billing", requireRoles('Owner', 'Admin'), reportHandler('billing'));
router.get("/inventory", requireRoles('Owner', 'Admin'), reportHandler('inventory'));
router.get("/menu", requireRoles('Owner', 'Admin'), reportHandler('menu'));
router.get("/vendor", requireRoles('Owner', 'Admin'), reportHandler('vendor'));
router.get("/purchase", requireRoles('Owner', 'Admin'), reportHandler('purchase'));
router.get("/offer", requireRoles('Owner', 'Admin'), reportHandler('offer'));
module.exports = router;
// end