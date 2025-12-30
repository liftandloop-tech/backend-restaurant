import * as inventoryService from "../services/inventoryService.js";
import { sendSuccess } from "../utils/response.js";


//new
import { AppError } from "../utils/errorHandler.js";

// Helper to resolve restaurantId
const resolveRestaurantId = async (userId) => {
  // Dynamic imports to avoid potential circular dependency issues
  const User = (await import('../models/user.js')).default;
  const Staff = (await import('../models/staff.js')).default;
  const Restaurant = (await import('../models/restaurant.js')).default;

  let restaurantId = null;
  const user = await User.findById(userId);
  if (user && user.restaurantId) {
    restaurantId = user.restaurantId;
  } else if (user) {
    const restaurant = await Restaurant.findByOwner(user._id);
    if (restaurant) {
      restaurantId = restaurant._id;
    } else {
      const staff = await Staff.findById(userId);
      if (staff && staff.restaurantId) {
        restaurantId = staff.restaurantId;
      }
    }
  } else {
    const staff = await Staff.findById(userId);
    if (staff && staff.restaurantId) {
      restaurantId = staff.restaurantId;
    }
  }
  return restaurantId;
};

export const getInventoryItems = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return sendSuccess(res, "Inventory items retrieved successfully", []);
    }//end
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
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const item = await inventoryService.getInventoryItemById(req.params.id, restaurantId);
    sendSuccess(res, "Inventory item retrieved successfully", item);
  } catch (error) {
    next(error);
  }
};

export const createInventoryItem = async (req, res, next) => {
  try {//new
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      // Only fail if we can't determine ID. But for creation we probably want to ensure it exists or create one?
      // The original code used ensureUserHasRestaurant. Let's stick to that if needed, 
      // but resolveRestaurantId is consistent for reading.
      const restaurantService = (await import('../services/restaurantService.js'));
      const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId);
      // Now we have it
    }

    // Re-resolve or just use what we found. `ensureUserHasRestaurant` might create one.
    // Let's use the explicit service call for safety on creation as per original design.
    const restaurantService = (await import('../services/restaurantService.js'));
    const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId);
//end

    const itemData = {
      ...req.body,
      restaurantId: restaurant._id
    };

    const item = await inventoryService.createInventoryItem(itemData);
    sendSuccess(res, "Inventory itme created successfully", item, 201);
  } catch (error) {
    next(error);
  }
};

export const updateInventoryItem = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const items = await inventoryService.updateInventoryItem(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Inventory item updated successfully", items);
  } catch (error) {
    next(error);
  }
};

export const deleteInventoryItem = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    await inventoryService.deleteInventoryItem(req.params.id, restaurantId);
    sendSuccess(res, "Inventory item deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getLowStockItems = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return sendSuccess(res, "Low stock items retrieved successfully", []);
    }
    const filters = { restaurantId: restaurantId };
    const items = await inventoryService.getLowStockItems(filters);
    sendSuccess(res, "Low stock items retrieved successfully", items);
  } catch (error) {
    next(error);
  }
};

// Vendors 
export const getVendors = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return sendSuccess(res, "Vendors retrieved successfully", []);
    }
    const filters = { restaurantId: restaurantId };
    const vendors = await inventoryService.getVendors(filters);
    sendSuccess(res, "Vendors retrieved successfully", vendors);
  } catch (error) {
    next(error);
  }
}

export const createVendor = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) throw new Error("Restaurant not found");
    const data = { ...req.body, restaurantId: restaurantId };
    const vendor = await inventoryService.createVendor(data);
    sendSuccess(res, "Vendor cerated successfully", vendor, 201);
  } catch (error) {
    next(error);
  }
};

// purchese orders
export const getPurchaseOrders = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return sendSuccess(res, "Purchase orders retrieved successfully", []);
    }
    const filters = { restaurantId: restaurantId };
    const pos = await inventoryService.getPurchaseOrders(filters);
    sendSuccess(res, "Purchase orders retrieved successfully", pos);
  } catch (error) {
    next(error);
  }
};

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      throw new Error("Restaurant not found for user");
    }
    const data = { ...req.body, restaurantId: restaurantId };
    const po = await inventoryService.createPurchaseOrder(data);
    sendSuccess(res, "Purchase order created successfully", po, 201);
  } catch (error) {
    next(error)
  }
};

export const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const po = await inventoryService.updatePurchaseOrderStatus(req.params.id, req.body.status, restaurantId);
    sendSuccess(res, "Purchase order status update successfully", po);
  } catch (error) {
    next(error)
  }
};
//new
// Wastage 
export const getWastage = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return sendSuccess(res, "Wastage records retrieved successfully", []);
    }
    const filters = { restaurantId: restaurantId };
    const wastage = await inventoryService.getWastage(filters);
    sendSuccess(res, "Wastage records retrieved successfully", wastage);
  } catch (error) {
    next(error)
  }
};

export const createWastage = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) throw new Error("Restaurant not found");
    const data = { ...req.body, restaurantId: restaurantId };
    const wastage = await inventoryService.createWastage(data);
    sendSuccess(res, "Wastage records created successfully", wastage);
  } catch (error) {
    next(error)
  }
};//end
