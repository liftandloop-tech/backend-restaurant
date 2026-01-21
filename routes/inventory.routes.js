const express = require("express");
const inventoryController = require("../controllers/inventoryController.js");
const { authMiddleware } = require("../middlewares/auth.js");
const { requireRoles } = require("../middlewares/roles.js");
const { validate, schemas } = require("../middlewares/validation.js");



const router = express.Router();

router.use(authMiddleware);

router.get("/get/item", inventoryController.getInventoryItems);
router.get("/get/item/by/id", inventoryController.getInventoryItemById);
router.post("/create/item", requireRoles('Owner', 'Admin', 'Manager', 'Cashier'), validate(schemas.inventoryItem), inventoryController.createInventoryItem)
router.put("/update/item/by/:id", requireRoles('Owner', 'Admin', 'Manager'), inventoryController.updateInventoryItem);
router.delete("/delete/item/by/:id", requireRoles('Owner', 'Admin', 'Manager'), inventoryController.deleteInventoryItem);
router.get("/get/low-stock/items", inventoryController.getLowStockItems);
// new for w
// Vendors
router.get("/vendors/get", inventoryController.getVendors);
router.post("/vendors/create", requireRoles('Owner', 'Admin', 'Manager'), inventoryController.createVendor);

// Purchase Orders
router.get("/purchase-orders/get", inventoryController.getPurchaseOrders);
router.post("/purchase-orders/create", requireRoles('Owner', 'Admin', 'Manager'), inventoryController.createPurchaseOrder);
router.put("/purchase-orders/update-status/:id", requireRoles('Owner', 'Admin', 'Manager'), inventoryController.updatePurchaseOrderStatus);

// Wastage
router.get("/wastage/get", inventoryController.getWastage);
router.post("/wastage/create", requireRoles('Owner', 'Admin', 'Manager'), inventoryController.createWastage);
// end
module.exports = router;
