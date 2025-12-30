import Customer from "../models/customer.js";
import { AppError } from "../utils/errorHandler.js";

// const Customer = require('../models/customer.js')
// const {AppError} = require('../utils/errorHandler.js')

export const getCustomers = async (filters = {}) => {
  const query = {};
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await Customer.find(query).sort({ createdAt: -1 });
};

export const getCustomerById = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const customer = await Customer.findOne(query);
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }
  return customer;
};
// new for w
export const createCustomer = async (data) => {
  // Check if customer with phone already exists in this restaurant
  const existing = await Customer.findOne({
    phone: data.phone,
    restaurantId: data.restaurantId
  });
  if (existing) {
    throw new AppError("Customer with this phone number already exists in this restaurant", 409);
  }

  const customer = await Customer.create(data);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.incrementRestaurantStat(data.restaurantId, 'totalCustomers');
  } catch (error) {
    console.error('Error updating restaurant stats after customer creation:', error);
  }

  return customer;
  // end
};

export const updateCustomer = async (id, data, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const customer = await Customer.findOneAndUpdate(query, data, { new: true, runValidators: true });
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }
  return customer;
};

export const deleteCustomer = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const customer = await Customer.findOne(query);
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }
//new
  // Store restaurantId before deletion for stats update
  const customerRestaurantId = customer.restaurantId;

  await Customer.findByIdAndDelete(id);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.decrementRestaurantStat(customerRestaurantId, 'totalCustomers');
  } catch (error) {
    console.error('Error updating restaurant stats after customer deletion:', error);
  }

  return customer;
};

