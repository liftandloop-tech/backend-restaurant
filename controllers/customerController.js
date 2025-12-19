import * as customerService from "../services/customerService.js";
import { sendSuccess } from "../utils/response.js";

// const{sendSuccess}=require('../utils/response.js')
// const customerService=require('../services/customerService.js')

export const getCustomers = async (req, res, next) => {
  try {
    // new 
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

    const customers = await customerService.getCustomers(filters);
    sendSuccess(res, "Customers retrieved successfully", customers);
  } catch (error) {
    next(error);
  }
};  
// end
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    sendSuccess(res, "Customer retrieved successfully", customer);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    // Ensure user has a restaurant (create one if needed)
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
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    sendSuccess(res, "Customer updated successfully", customer);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    sendSuccess(res, "Customer deleted successfully");
  } catch (error) {
    next(error);
  }
};

