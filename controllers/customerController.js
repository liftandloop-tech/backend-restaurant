//total new
import * as customerService from "../services/customerService.js";
import { sendSuccess } from "../utils/response.js";

// Helper to resolve restaurantId
const resolveRestaurantId = async (userId) => {
  // Dynamic imports to avoid potential circular dependency issues
  const User = (await import('../models/user.js')).default;
  const Staff = (await import('../models/staff.js')).default;
  const Restaurant = (await import('../models/restaurant.js')).default;

  let restaurantId = null;
  const user = await User.findById(userId);
  if (user && user.restaurantId) {
    restaurantId = user.restaurantId;
  } else if (user) {
    const restaurant = await Restaurant.findByOwner(user._id);
    if (restaurant) {
      restaurantId = restaurant._id;
    } else {
      const staff = await Staff.findById(userId);
      if (staff && staff.restaurantId) {
        restaurantId = staff.restaurantId;
      }
    }
  } else {
    const staff = await Staff.findById(userId);
    if (staff && staff.restaurantId) {
      restaurantId = staff.restaurantId;
    }
  }
  return restaurantId;
};

export const getCustomers = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return sendSuccess(res, "Customers retrieved successfully", []);
    }
    const filters = {
      ...req.query,
      restaurantId: restaurantId
    };
    const customers = await customerService.getCustomers(filters);
    sendSuccess(res, "Customers retrieved successfully", customers);
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const customer = await customerService.getCustomerById(req.params.id, restaurantId);
    sendSuccess(res, "Customer retrieved successfully", customer);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    // Ensure user has a restaurant (create one if needed)
    // resolveRestaurantId handles finding it, but this specific call might need ensureUserHasRestaurant if we want to auto-create
    // mimicking previous logic for safety
    const restaurantService = (await import('../services/restaurantService.js'));
    const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId);

    const customerData = {
      ...req.body,
      restaurantId: restaurant._id
    };

    const customer = await customerService.createCustomer(customerData);
    sendSuccess(res, "Customer created successfully", customer, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const customer = await customerService.updateCustomer(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Customer updated successfully", customer);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    await customerService.deleteCustomer(req.params.id, restaurantId);
    sendSuccess(res, "Customer deleted successfully");
  } catch (error) {
    next(error);
  }
};
