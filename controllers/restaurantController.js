// all new for w
import * as restaurantService from "../services/restaurantService.js";
import { sendSuccess, sendError } from "../utils/response.js";

// const { sendSuccess, sendError } = require('../utils/response');
// const restaurantService = require('../services/restaurantService');

export const createRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.createRestaurant(req.body, req.user.userId);
    sendSuccess(res, "Restaurant created successfully", restaurant, 201);
  } catch (error) {
    next(error);
  }
};

export const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    sendSuccess(res, "Restaurant retrieved successfully", restaurant);
  } catch (error) {
    next(error);
  }
};

export const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantByOwner(req.user.userId);
    sendSuccess(res, "Restaurant retrieved successfully", restaurant);
  } catch (error) {
    next(error);
  }
};

export const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id,
      req.body,
      req.user.userId
    );
    sendSuccess(res, "Restaurant updated successfully", restaurant);
  } catch (error) {
    next(error);
  }
};

export const deleteRestaurant = async (req, res, next) => {
  try {
    const result = await restaurantService.deleteRestaurant(req.params.id, req.user.userId);
    sendSuccess(res, "Restaurant deleted successfully", result);
  } catch (error) {
    next(error);
  }
};

export const getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await restaurantService.getAllRestaurants(req.query);
    sendSuccess(res, "Restaurants retrieved successfully", restaurants);
  } catch (error) {
    next(error);
  }
};




export const updateRestaurantLicense = async (req, res, next) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) {
      return sendError(res, "License key is required", 400);
    }

    const restaurant = await restaurantService.updateRestaurantLicense(
      req.params.id,
      licenseKey,
      req.user.userId
    );
    sendSuccess(res, "Restaurant license updated successfully", restaurant);
  } catch (error) {
    next(error);
  }
};

// Special endpoint for adding bill amount to restaurant account
// This will be called automatically when a bill is paid
export const addBillToRestaurantAccount = async (req, res, next) => {
  try {
    const { billAmount, billId } = req.body;

    if (!billAmount || billAmount <= 0) {
      return sendError(res, "Valid bill amount is required", 400);
    }

    if (!billId) {
      return sendError(res, "Bill ID is required", 400);
    }

    // For now, we'll assume there's only one restaurant per owner
    // In a multi-restaurant system, you'd need to determine which restaurant the bill belongs to
    const restaurant = await restaurantService.getRestaurantByOwner(req.user.userId);

    const result = await restaurantService.addBillToRestaurantAccount(
      restaurant._id,
      billAmount,
      billId
    );

    sendSuccess(res, "Bill amount added to restaurant account successfully", result);
  } catch (error) {
    next(error);
  }
};
// new for w
export const getRestaurantStats = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    const stats = await restaurantService.updateRestaurantStats(restaurantId);
    sendSuccess(res, "Restaurant statistics retrieved successfully", stats);
  } catch (error) {
    next(error);
  }
};

export const recalculateRestaurantStats = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    const stats = await restaurantService.recalculateRestaurantStats(restaurantId);
    sendSuccess(res, "Restaurant statistics recalculated successfully", stats);
  } catch (error) {
    next(error);
  }
};

export const getMyRestaurantStats = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantByOwner(req.user.userId);
    const stats = await restaurantService.updateRestaurantStats(restaurant._id);
    sendSuccess(res, "Restaurant statistics retrieved successfully", {
      restaurant: restaurant,
      stats: stats
    });
  } catch (error) {
    next(error);
  }
};  // end