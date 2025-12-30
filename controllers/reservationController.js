//total new
import * as reservationService from "../services/reservationService.js";
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

export const getReservations = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);

    // Clean filters
    const cleanQuery = {};
    Object.keys(req.query).forEach(key => {
      const val = req.query[key];
      if (val !== undefined && val !== null && val !== 'undefined' && val !== 'null' && val !== 'all' && val !== '') {
        cleanQuery[key] = val;
      }
    });

    const filters = {
      ...cleanQuery,
      restaurantId: restaurantId
    };

    if (!restaurantId) {
      return sendSuccess(res, "Reservations retrieved successfully", []);
    }

    const reservations = await reservationService.getReservations(filters);
    sendSuccess(res, "Reservations retrieved successfully", reservations);
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const reservation = await reservationService.getReservationById(req.params.id, restaurantId);
    sendSuccess(res, "Reservation retrieved successfully", reservation);
  } catch (error) {
    next(error);
  }
};

export const createReservation = async (req, res, next) => {
  try {
    // Ensure user has a restaurant (create one if needed)
    const restaurantService = (await import('../services/restaurantService.js'));
    const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId);

    const reservationData = {
      ...req.body,
      restaurantId: restaurant._id
    };

    const reservation = await reservationService.createReservation(reservationData);
    sendSuccess(res, "Reservation created successfully", reservation, 201);
  } catch (error) {
    next(error);
  }
};

export const updateReservation = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const reservation = await reservationService.updateReservation(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Reservation updated successfully", reservation);
  } catch (error) {
    next(error);
  }
};

export const updateReservationStatus = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const reservation = await reservationService.updateReservationStatus(req.params.id, req.body.status, req.user.userId, restaurantId);
    sendSuccess(res, "Reservation status updated successfully", reservation);
  } catch (error) {
    next(error);
  }
};

export const deleteReservation = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    await reservationService.deleteReservation(req.params.id, restaurantId);
    sendSuccess(res, "Reservation deleted successfully");
  } catch (error) {
    next(error);
  }
};
