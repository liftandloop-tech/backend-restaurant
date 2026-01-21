// all new for w
const express = require("express");
const restaurantController = require("../controllers/restaurantController.js");
const { authMiddleware } = require("../middlewares/auth.js");
const { requireRoles } = require("../middlewares/roles.js");
const { validate, schemas } = require("../middlewares/validation.js");
const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create restaurant - Only authenticated users can create restaurants
router.post("/create", validate(schemas.restaurant), restaurantController.createRestaurant);

// Get restaurant by ID - Restaurant owner or admin
router.get("/get/:id", restaurantController.getRestaurant);

// Get current user's restaurant - Restaurant owner
router.get("/get/my", restaurantController.getMyRestaurant);
router.get("/my-restaurant", restaurantController.getMyRestaurant);

// Update restaurant - Restaurant owner or admin
router.put("/update/:id", validate(schemas.updateRestaurant), restaurantController.updateRestaurant);

// Delete restaurant - Restaurant owner or admin
router.delete("/delete/:id", restaurantController.deleteRestaurant);

// Get all restaurants - Admin only
router.get("/get/all", requireRoles('Admin'), restaurantController.getAllRestaurants);

// Get restaurant statistics - Restaurant owner or admin
router.get("/stats/:id", restaurantController.getRestaurantStats);

// Recalculate restaurant statistics - Restaurant owner or admin
router.post("/stats/recalculate/:id", restaurantController.recalculateRestaurantStats)

// Get current user's restaurant statistics - Restaurant owner
router.get("/stats/my", restaurantController.getMyRestaurantStats);

// Update restaurant license - Restaurant owner or admin
router.put("/license/:id", restaurantController.updateRestaurantLicense);

// Add bill amount to restaurant account - Called automatically when bill is paid
router.post("/add-bill-amount", restaurantController.addBillToRestaurantAccount);

module.exports = router;
