//total new
import * as customerService from "../services/customerService.js";
import { sendSuccess } from "../utils/response.js";

import { resolveRestaurantId } from "../utils/context.js";

export const getCustomers = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
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
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const customer = await customerService.getCustomerById(req.params.id, restaurantId);
    sendSuccess(res, "Customer retrieved successfully", customer);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    let restaurantId = await resolveRestaurantId(req.user.userId, req);

    if (!restaurantId) {
      throw { statusCode: 400, message: "Restaurant context not found. Please ensure you are logged in correctly." };
    }

    const customerData = {
      ...req.body,
      restaurantId: restaurantId
    };

    const customer = await customerService.createCustomer(customerData);
    sendSuccess(res, "Customer created successfully", customer, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const customer = await customerService.updateCustomer(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Customer updated successfully", customer);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    await customerService.deleteCustomer(req.params.id, restaurantId);
    sendSuccess(res, "Customer deleted successfully");
  } catch (error) {
    next(error);
  }
};
