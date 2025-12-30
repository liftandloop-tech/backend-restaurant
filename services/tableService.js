import Table from "../models/table.js";
import { AppError } from "../utils/errorHandler.js";
import Order from "../models/order.js"


// const Table = require('../models/table.js')
// const {AppError} = require('../utils/errorHandler.js')
// const Order = require('../models/order.js')

export const getTables = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.location) query.location = filters.location;
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await Table.find(query).populate({
    path: 'currentOrderId',
    populate: {
      path: 'waiterId customerId',
      select: 'fullName name phoneNumber' // Select fields to return
    }
  }).sort({ tableNumber: 1 });
};

export const getTableById = async (id, restaurantId) => {
  const table = await Table.findById(id).populate('currentOrderId');
  if (!table) {
    throw new AppError("Table not found", 404);
  }

  if (restaurantId && table.restaurantId && table.restaurantId.toString() !== restaurantId.toString()) {
    throw new AppError("You don't have permission to view this table", 403);
  }

  return table;
};

export const createTable = async (data) => {
  //new for w
  // Check if table with same number already exists in this restaurant
  const existingTable = await Table.findOne({
    tableNumber: data.tableNumber,
    restaurantId: data.restaurantId
  });

  if (existingTable) {
    throw new AppError(`Table number ${data.tableNumber} already exists in this restaurant`, 409);
  }

  const table = await Table.create(data);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.incrementRestaurantStat(data.restaurantId, 'totalTables');
  } catch (error) {
    console.error('Error updating restaurant stats after table creation:', error);
  }

  return table;
};

export const updateTable = async (id, data, restaurantId) => {
  // First check if table exists and belongs to user's restaurant
  const existingTable = await Table.findById(id);
  if (!existingTable) {
    throw new AppError("Table not found", 404);
  }

  // Ensure the table belongs to the user's restaurant
  if (existingTable.restaurantId.toString() !== restaurantId.toString()) {
    throw new AppError("You can only update tables from your restaurant", 403);
  }

  const table = await Table.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  return table;
};

export const updateTableStatus = async (id, status, restaurantId) => {
  // First check if table exists and belongs to user's restaurant
  const existingTable = await Table.findById(id);
  if (!existingTable) {
    throw new AppError("Table not found", 404);
  }

  // Ensure the table belongs to the user's restaurant
  if (existingTable.restaurantId.toString() !== restaurantId.toString()) {
    throw new AppError("You can only update tables from your restaurant", 403);
  }

  const table = await Table.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  return table;
};
export const transferTable = async (tableNumber, restaurantId) => {
  const table = await Table.findOneAndUpdate(
    { tableNumber, restaurantId },
    { status: 'available' },
    { new: true, runValidators: true }
  );
  if (!table) {
    throw new AppError("Table not found ", 404);
  }
  return table;
};
export const completeCleaning = async (tableNumber, restaurantId) => {
  const table = await Table.findOneAndUpdate(
    { tableNumber, restaurantId, status: 'cleaning' },
    { status: 'available' },
    { new: true, runValidators: true }
  );
  if (!table) {
    throw new AppError("Table not found or not in cleaning status", 404);
  }
  return table;
}
export const deleteTable = async (id, restaurantId) => {
  const table = await Table.findById(id);

  if (!table) {
    throw new AppError("Table not found", 404);
  }

  // Ensure the table belongs to the user's restaurant
  if (table.restaurantId.toString() !== restaurantId.toString()) {
    throw new AppError("You can only delete tables from your restaurant", 403);
  }

  //  check if table has active orders
  const activeOrders = await Order.find({
    tableNumber: table.tableNumber,
    status: { $nin: ['cancelled', 'served'] },
    restaurantId: restaurantId // Also scope orders to restaurant
  });

  if (activeOrders.length > 0) {
    throw new AppError("Cannot delete table with active orders. Please complete or cancel all orders first ", 400);
  }

  // Delete the table
  await Table.findByIdAndDelete(id);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.decrementRestaurantStat(restaurantId, 'totalTables');
  } catch (error) {
    console.error('Error updating restaurant stats after table deletion:', error);
  }

  return table;
};

// end