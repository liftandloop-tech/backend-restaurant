import Category from "../models/category.js";
import MenuItem from "../models/menu.js";
import { AppError } from "../utils/errorHandler.js";



// const Category= require('../models/categery.js')
// const MenuItem = require('../models/menu.js')
// const {AppError} = require('../utils/errorHandler.js')

export const getCategories = async (filters = {}) => {
  const query = {};
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await Category.find(query).sort({ displayOrder: 1, createdAt: -1 });
};

export const createCategory = async (data) => {
  return await Category.create(data);
};

export const updateCategory = async (id, data, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const category = await Category.findOneAndUpdate(query, data, { new: true, runValidators: true });
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
};

export const deleteCategory = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const category = await Category.findOneAndDelete(query);
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
};

export const getMenuItems = async (filters = {}) => {
  const query = {};
  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable;
  if (filters.foodType) query.foodType = filters.foodType;
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;

  return await MenuItem.find(query).populate('categoryId', 'name').sort({ displayOrder: 1, createdAt: -1 });
};

export const getMenuItemById = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const item = await MenuItem.findOne(query).populate('categoryId');
  if (!item) {
    throw new AppError("Menu item not found", 404);
  }
  return item;
};
// new for w
export const createMenuItem = async (data) => {
  const menuItem = await MenuItem.create(data);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.incrementRestaurantStat(data.restaurantId, 'totalMenuItems');
  } catch (error) {
    console.error('Error updating restaurant stats after menu item creation:', error);
  }

  return menuItem;
};
// end

export const updateMenuItem = async (id, data, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const item = await MenuItem.findOneAndUpdate(query, data, { new: true, runValidators: true });
  if (!item) {
    throw new AppError("Menu item not found", 404);
  }
  return item;
};
//new for w
export const deleteMenuItem = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const item = await MenuItem.findOne(query);
  if (!item) {
    throw new AppError("Menu item not found", 404);
  }

  // Store restaurantId before deletion for stats update
  const itemRestaurantId = item.restaurantId;

  await MenuItem.findByIdAndDelete(id);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.decrementRestaurantStat(itemRestaurantId, 'totalMenuItems');
  } catch (error) {
    console.error('Error updating restaurant stats after menu item deletion:', error);
  }

  return item;
};
// end
