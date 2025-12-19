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

export const updateCategory = async (id, data) => {
  const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
};

export const deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);
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

export const getMenuItemById = async (id) => {
  const item = await MenuItem.findById(id).populate('categoryId');
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

export const updateMenuItem = async (id, data) => {
  const item = await MenuItem.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!item) {
    throw new AppError("Menu item not found", 404);
  }
  return item;
};
//new for w
export const deleteMenuItem = async (id) => {
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError("Menu item not found", 404);
  }

  // Store restaurantId before deletion for stats update
  const restaurantId = item.restaurantId;

  await MenuItem.findByIdAndDelete(id);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.decrementRestaurantStat(restaurantId, 'totalMenuItems');
  } catch (error) {
    console.error('Error updating restaurant stats after menu item deletion:', error);
  }

  return item;
};
// end
