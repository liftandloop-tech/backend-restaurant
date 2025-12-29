import user from "../models/user.js";
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
      
     // If user doesn't have restaurantId, check if they are the owner
        const restaurant = await Restaurant.findByOwner(req.user.userId);
        if(restaurant){
           restaurantId = restaurant._id;

         } else {
           // Try staff lookup as fallback
        const staff = await Staff.findById(req.user.userId);
        if(staff && staff.restaurantId) {
          restaurantId = staff.restaurantId;
      }
   }
}
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
    
   // Ensure user has a restaurant (create one if needed)
     const restaurantService = (await import('../services/restaurantService.js'));

     const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId)

      const itemData = {
        ...req.body,
        restaurantId: restaurant._id
      };

      const item = await inventoryService.createInventoryItem(itemData);
      sendSuccess(res, "Inventory itme created successfully", item, 201);
    } catch(error) {
       next(error);
    }
};
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

// Vendors 
export const getVendors = async (req, res,next) => {
  try{
      const Restaurant = (await import('../models/restaurant.js')).default;
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      const filters = {restaurantId: restaurant ? restaurant._id : req.query.restaurantId };
      const vendors = await inventoryService.getVendors(filters);
      sendSuccess(res, "Vendors retrieved successfully", vendors);
  } catch(error) {
    next(error);
  }
}

   export const createVendor = async (req, res, next) => {
    try{
      const Restaurant = (await import('../models/restaurant.js')).default;
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      const data = { ...req.body, restaurantId: restaurant._id};
      const vendor = await inventoryService.createVendor(data);
      sendSuccess(res, "Vendor cerated successfully", vendor, 201);
    } catch(error){
      next(error);
    }
  };

// purchese orders
export const getPurchaseOrders = async (req, res, next) => {
   try{
    const Restaurant = (await import('../models/restaurant.js')).default;
    const restaurant = await Restaurant.findByOwner(req.user.userId);
    const filters = {restaurantId: restaurant ? restaurant._id : req.query.restaurantId };
    const pos = await inventoryService.getPurchaseOrders(filters);
    sendSuccess(res, "Purchase orders retrieved successfully", pos);
   } catch(error) {
     next(error);
   }
};



  export const createPurchaseOrder = async (req, res, next) => {
    try{
      const Restaurant = await import('../models/restaurant.js').default;
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      const data = {...req.body, restaurantId: restaurant._id };
      const po = await inventoryService.createPurchaseOrder(data);
      sendSuccess(res, "Purchase order created successfully", po, 201);
    }catch(error){
      next(error)
    }
  };

   export const updatePurchaseOrderStatus = async (req,res,next) => {
    try {
      const po = await inventoryService.updatePurchaseOrderStatus(req.params.id,req.body.status);
      sendSuccess(res, "Purchase order status update successfully", po);
    } catch(error) {
      next(error)
    }
  }; 
   

// Wastage 
export const getWastage = async (req, res, next) => {
    try {
      const Restaurant = await import('../models/restaurant.js').default;
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      const filters = {restaurantId: restaurant ? restaurant._id : req.query.restaurantId };
      const wastage = await inventoryService.getWastage(filters);
      sendSuccess(res, "Wastage records retrieved successfully",wastage);
    } catch(error) {
      next(error)
    }
  };

  export const createWastage = async (req, res, next) => {
    try {
      const Restaurant = await import('../models/restaurant.js').default;
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      const data = {...req.body, restaurantId: restaurant._id };
      const wastage = await inventoryService.createWastage(data);
      sendSuccess(res, "Wastage records created successfully",wastage);
    } catch(error) {
      next(error)
    }
  };


