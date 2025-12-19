import * as reservationService from "../services/reservationService.js";
import { sendSuccess } from "../utils/response.js";

// const{sendSuccess,}=require('../utils/response.js')
// const reservationService=require('../services/reservationService.js')

export const getReservations = async (req, res, next) => {
  try {
    // new for w
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

    const reservations = await reservationService.getReservations(filters);
    sendSuccess(res, "Reservations retrieved successfully", reservations);
  } catch (error) {
    next(error);
  }
};
//end
export const getReservationById = async (req, res, next) => {
  try {
    const reservation = await reservationService.getReservationById(req.params.id);
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
    const reservation = await reservationService.updateReservation(req.params.id, req.body);
    sendSuccess(res, "Reservation updated successfully", reservation);
  } catch (error) {
    next(error);
  }
};

export const updateReservationStatus = async (req, res, next) => {
  try {
    const reservation = await reservationService.updateReservationStatus(req.params.id, req.body.status, req.user.userId);
    sendSuccess(res, "Reservation status updated successfully", reservation);
  } catch (error) {
    next(error);
  }
};

export const deleteReservation = async (req, res, next) => {
  try {
    await reservationService.deleteReservation(req.params.id);
    sendSuccess(res, "Reservation deleted successfully");
  } catch (error) {
    next(error);
  }
};

