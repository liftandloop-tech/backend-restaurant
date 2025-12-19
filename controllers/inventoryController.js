import * as inventoryService from "../services/inventoryService.js";
import { sendSuccess } from "../utils/response.js";

// const{sendSuccess}=require('../utils/response.js')
// const inventoryService=require('../services/inventoryService.js')

export const getInventoryItems = async (req, res, next) => {
  try {
    // Get restaurantId from user
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;
// First try to get restaurant from user model
   

    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else {
      // new for w
      // If user doesn't have restaurantId, check if they're the owner
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      if (restaurant) {
        restaurantId = restaurant._id;
      } else {
        // Try staff lookup as fallback
        const staff = await Staff.findById(req.user.userId);
        if (staff && staff.restaurantId) {
          restaurantId = staff.restaurantId;
        }
      }
    } // error

    const filters = {
      ...req.query,
      restaurantId: restaurantId
    };

    const items = await inventoryService.getInventoryItems(filters);
    sendSuccess(res, "Inventory items retrieved successfully", items);
  } catch (error) {
    next(error);
  }
};

export const getInventoryItemById = async (req, res, next) => {
  try {
    const item = await inventoryService.getInventoryItemById(req.params.id);
    sendSuccess(res, "Inventory item retrieved successfully", item);
  } catch (error) {
    next(error);
  }
};

export const createInventoryItem = async (req, res, next) => {
  try {
    // new for w
    // Ensure user has a restaurant (create one if needed)
    const restaurantService = (await import('../services/restaurantService.js'));
    const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId);

    const itemData = {
      ...req.body,
      restaurantId: restaurant._id
    };

    const item = await inventoryService.createInventoryItem(itemData);
    sendSuccess(res, "Inventory item created successfully", item, 201);
  } catch (error) {
    next(error);
  }
};
// end

export const updateInventoryItem = async (req, res, next) => {
  try {
    const items = await inventoryService.updateInventoryItem(req.params.id, req.body);
    sendSuccess(res, "Inventory item updated successfully", items);
  } catch (error) {
    next(error);
  }
};

export const deleteInventoryItem = async (req, res, next) => {
  try {
    await inventoryService.deleteInventoryItem(req.params.id);
    sendSuccess(res, "Inventory item deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getLowStockItems = async (req, res, next) => {
  try {
    const items = await inventoryService.getLowStockItems();
    sendSuccess(res, "Low stock items retrieved successfully", items);
  } catch (error) {
    next(error);
  }
};

