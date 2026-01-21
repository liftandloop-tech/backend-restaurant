// import * as menuService from "../services/menuService.js";
const menuService = require("../services/menuService.js");
const { sendSuccess, sendError   } =require ("../utils/response.js");

const { resolveRestaurantId   } =require( "../utils/context.js");



exports. getCategories = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);

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


exports. createCategory = async (req, res, next) => {
  try {

    // Ensure user has a restaurant (create one if needed) 
    let restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      throw { statusCode: 400, message: "Restaurant context not found. Please ensure you are logged in correctly." };
    }
    const categoryData = {
      ...req.body,
      restaurantId: restaurantId
    }
    const category = await menuService.createCategory(categoryData);
    sendSuccess(res, "Category created successfully", category, 201);
  } catch (error) {
    next(error);
  }
};

exports. updateCategory = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const category = await menuService.updateCategory(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Category updated successfully", category);
  } catch (error) {
    next(error);
  }
};

exports. deleteCategory = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    await menuService.deleteCategory(req.params.id, restaurantId);
    sendSuccess(res, "Category deleted successfully");
  } catch (error) {
    next(error);
  }
};

exports. getMenuItems = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
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


exports. getMenuItemById = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const item = await menuService.getMenuItemById(req.params.id, restaurantId);
    sendSuccess(res, "Menu item retrieved successfully", item);
  } catch (error) {
    next(error);
  }
};

exports. createMenuItem = async (req, res, next) => {
  try {
    // Ensure user has a restaurant (create one if needed)
    let restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      throw { statusCode: 400, message: "Restaurant context not found. Please ensure you are logged in correctly." };
    }

    const itemData = {
      ...req.body,
      restaurantId: restaurantId
    };

    const item = await menuService.createMenuItem(itemData);
    sendSuccess(res, "Menu item created successfully", item, 201);
  } catch (error) {
    next(error);
  }
};

exports. updateMenuItem = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const item = await menuService.updateMenuItem(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Menu item updated successfully", item);
  } catch (error) {
    next(error);
  }
};

exports. deleteMenuItem = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    await menuService.deleteMenuItem(req.params.id, restaurantId);
    sendSuccess(res, "Menu item deleted successfully");
  } catch (error) {
    next(error);
  }
};
