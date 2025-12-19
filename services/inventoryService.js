import InventoryItem from "../models/inventory.js";
import { AppError } from "../utils/errorHandler.js";


// const InventoryItem = require('../models/inventory.js')
// const {AppError} = require('../utils/errorHandler.js')

export const getInventoryItems = async (filters = {}) => {
  const query = {};
  if (filters.category) query.category = filters.category;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

if (filters.restaurantId){
  query.restaurantId = filters.restaurantId;
}
  return await InventoryItem.find(query).sort({ name: 1 });
};

export const getInventoryItemById = async (id) => {
  const item = await InventoryItem.findById(id);
  if (!item) {
    throw new AppError("Inventory item not found", 404);
  }
  return item;
};
//new for w
export const createInventoryItem = async (data) => {
  const item = await InventoryItem.create(data);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.incrementRestaurantStat(data.restaurantId, 'totalInventoryItems');
  } catch (error) {
    console.error('Error updating restaurant stats after inventory item creation:', error);
  }

  return item;
};
// end
export const updateInventoryItem = async (id, data) => {
  const item = await InventoryItem.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!item) {
    throw new AppError("Inventory item not found", 404);
  }
  return item;
};
// new for w
export const deleteInventoryItem = async (id) => {
  const item = await InventoryItem.findById(id);
  if (!item) {
    throw new AppError("Inventory item not found", 404);
  }

  // Store restaurantId before deletion for stats update
  const restaurantId = item.restaurantId;

  await InventoryItem.findByIdAndDelete(id);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.decrementRestaurantStat(restaurantId, 'totalInventoryItems');
  } catch (error) {
    console.error('Error updating restaurant stats after inventory item deletion:', error);
  }

  return item;
};
// end
export const getLowStockItems = async () => {
  return await InventoryItem.find({
    $expr: { $lte: ['$currentStock', '$minStockLevel'] }
  }).sort({ currentStock: 1 });
};

