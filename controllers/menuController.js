import * as menuService from "../services/menuService.js";
import { sendSuccess, sendError } from "../utils/response.js";

// Helper to resolve restaurantId
const resolveRestaurantId = async (userId) => {
  // Dynamic imports to avoid potential circular dependency issues
  const User = (await import('../models/user.js')).default;
  const Staff = (await import('../models/staff.js')).default;
  const Restaurant = (await import('../models/restaurant.js')).default;

  let restaurantId = null;


  //First try to get restaurantId from the user model
  const user = await User.findById(userId);
  if (user && user.restaurantId) {
    restaurantId = user.restaurantId;
  } else if (user) {
    const restaurant = await Restaurant.findByOwner(user._id);
    if (restaurant) {
      restaurantId = restaurant._id;
    } else {
      //Try staff lookup as fallback 
      const staff = await Staff.findById(userId);
      if (staff && staff.restaurantId) {
        restaurantId = staff.restaurantId;
      }
    }
  //   //new
  // } else {
  //   const staff = await Staff.findById(userId);
  //   if (staff && staff.restaurantId) {
  //     restaurantId = staff.restaurantId;
  //   }
  // }
       } else {
        // User no found in user collection try Staff
         const staff = await Staff.findById(userId);
         if (staff && staff.restaurantId) {
           restaurantId = staff.restaurantId;
         }
      }   
     
  return restaurantId;
};



export const getCategories = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);

    // clean filters
    const cleanQuery = {};
    Object.keys(req.query).forEach(key => {
      const val = req.query[key];
      if (val !== undefined && val !== null && val !== 'undefined' && val !== 'null' && val !== 'all' && val !== '') {
        cleanQuery[key] = val;
      }
    });

    const filters = {
      ...cleanQuery,
      restaurantId: restaurantId
    };

    if (!restaurantId) {
      return sendSuccess(res, "Categories retrieved successfully", []);
    }

    const categories = await menuService.getCategories(filters);
    sendSuccess(res, "Categories retrieved successfully", categories);
  } catch (error) {
    next(error);
  }
};


export const createCategory = async (req, res, next) => {
  try {

    // Ensure user has a restaurant (create one if needed) 
    const restaurantService = (await import('../services/restaurantService.js'));
    const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId);
    const categoryData = {
      ...req.body,
      restaurantId: restaurant._id
    }
    const category = await menuService.createCategory(categoryData);
    sendSuccess(res, "Category created successfully", category, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const category = await menuService.updateCategory(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Category updated successfully", category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    await menuService.deleteCategory(req.params.id, restaurantId);
    sendSuccess(res, "Category deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getMenuItems = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    // clean filters
    const cleanQuery = {};
    Object.keys(req.query).forEach(key => {
      const val = req.query[key];
      if (val !== undefined && val !== null && val !== 'undefined' && val !== 'null' && val !== 'all' && val !== '') {
        cleanQuery[key] = val;
      }
    });

    const filters = {
      ...cleanQuery,
      restaurantId: restaurantId
    };

    if (!restaurantId) {
      return sendSuccess(res, "Menu items retrieved successfully", []);
    }

    const items = await menuService.getMenuItems(filters);
    sendSuccess(res, "Menu items retrieved successfully", items);
  } catch (error) {
    next(error);
  }
};


export const getMenuItemById = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const item = await menuService.getMenuItemById(req.params.id, restaurantId);
    sendSuccess(res, "Menu item retrieved successfully", item);
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    // Ensure user has a restaurant (create one if needed)
    const restaurantService = (await import('../services/restaurantService.js'));
    const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId);

    const itemData = {
      ...req.body,
      restaurantId: restaurant._id
    };

    const item = await menuService.createMenuItem(itemData);
    sendSuccess(res, "Menu item created successfully", item, 201);
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const item = await menuService.updateMenuItem(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Menu item updated successfully", item);
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    await menuService.deleteMenuItem(req.params.id, restaurantId);
    sendSuccess(res, "Menu item deleted successfully");
  } catch (error) {
    next(error);
  }
};
