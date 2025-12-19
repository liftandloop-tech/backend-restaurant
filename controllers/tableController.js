import * as tableService from "../services/tableService.js";
import { sendSuccess } from "../utils/response.js";

// const{sendSuccess}=require('../utils/response.js')
// const tableService=require('../services/tableService.js')

export const getTables = async (req, res, next) => {
  try {
    // new for w
    // Get restaurantId from user
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;

    // First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else {
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
    }

    const filters = {
      ...req.query,
      restaurantId: restaurantId
    };

    const tables = await tableService.getTables(filters);
    sendSuccess(res, "Tables retrieved successfully", tables);
  } catch (error) {
    next(error);
  }
};

export const getTableById = async (req, res, next) => {
  try {
    const table = await tableService.getTableById(req.params.id);
    sendSuccess(res, "Table retrieved successfully", table);
  } catch (error) {
    next(error);
  }
};


export const createTable = async (req, res, next) => {
  try {
    // Ensure user has a restaurant (create one if needed)
    const restaurantService = (await import('../services/restaurantService.js'));
    const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId);

    const tableData = {
      ...req.body,
      restaurantId: restaurant._id
    };
// end 
    const table = await tableService.createTable(tableData);
    sendSuccess(res, "Table created successfully", table, 201);
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (req, res, next) => {
  try {
    //new for w
    // Get restaurantId from user to ensure they can only update tables from their restaurant
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;

    // First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else {
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
    }

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.updateTable(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Table updated successfully", table);
  } catch (error) {
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  try {
    // Get restaurantId from user
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;

    // First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else {
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
    }

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.updateTableStatus(req.params.id, req.body.status, restaurantId);
    sendSuccess(res, "Table status updated successfully", table);
  } catch (error) {
    next(error);
  }
};


export const transferTable = async (req, res, next) => {
  try{
    // Get restaurantId from user
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;

    // First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else {
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
    }

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.transferTable(req.params.tableNumber, restaurantId);
    sendSuccess(res, "Table transferred successfully", table);

  }catch(error){
    next(error);
  }
};
export const completeCleaning = async (req, res, next) => {
  try{
    // Get restaurantId from user
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;

    // First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else {
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
    }

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.completeCleaning(req.params.tableNumber, restaurantId);
    sendSuccess(res, "Table cleaning completed successfully", table);

  }catch(error){
    next(error);
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    // Get restaurantId from user
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;

    // First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else {
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
    }

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    await tableService.deleteTable(req.params.id, restaurantId);
    sendSuccess(res, "Table deleted successfully");
  } catch (error) {
    next(error);
  }
};// end

