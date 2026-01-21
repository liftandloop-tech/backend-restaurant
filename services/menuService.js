const Category = require("../models/category.js");
const MenuItem = require("../models/menu.js");
const { AppError } = require("../utils/errorHandler.js");

exports.getCategories = async (filters = {}) => {
  const query = {};
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await Category.find(query).sort({ displayOrder: 1, createdAt: -1 });
};

exports.createCategory = async (data) => {
  return await Category.create(data);
};

exports.updateCategory = async (id, data, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const category = await Category.findOneAndUpdate(query, data, { new: true, runValidators: true });
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
};

exports.deleteCategory = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const category = await Category.findOneAndDelete(query);
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  return category;
};

exports.getMenuItems = async (filters = {}) => {
  const query = {};
  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable;
  if (filters.foodType) query.foodType = filters.foodType;
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;

  return await MenuItem.find(query).populate('categoryId', 'name').sort({ displayOrder: 1, createdAt: -1 });
};

exports.getMenuItemById = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const item = await MenuItem.findOne(query).populate('categoryId');
  if (!item) {
    throw new AppError("Menu item not found", 404);
  }
  return item;
};
// new for w
exports.createMenuItem = async (data) => {
  const menuItem = await MenuItem.create(data);

  // Update restaurant statistics
  try {
    const { default: restaurantService } = await import("../services/restaurantService.js");
    await restaurantService.incrementRestaurantStat(data.restaurantId, 'totalMenuItems');
  } catch (error) {
    console.error('Error updating restaurant stats after menu item creation:', error);
  }

  return menuItem;
};
// end

exports.updateMenuItem = async (id, data, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const item = await MenuItem.findOneAndUpdate(query, data, { new: true, runValidators: true });
  if (!item) {
    throw new AppError("Menu item not found", 404);
  }
  return item;
};
//new for w
exports.deleteMenuItem = async (id, restaurantId) => {
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
    const { default: restaurantService } = await import("../services/restaurantService.js");
    await restaurantService.decrementRestaurantStat(itemRestaurantId, 'totalMenuItems');
  } catch (error) {
    console.error('Error updating restaurant stats after menu item deletion:', error);
  }

  return item;
};
// end
