//total new
import * as reservationService from "../services/reservationService.js";
import { sendSuccess } from "../utils/response.js";

import { resolveRestaurantId } from "../utils/context.js";

export const getReservations = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);

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
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
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
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const reservation = await reservationService.updateReservation(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Reservation updated successfully", reservation);
  } catch (error) {
    next(error);
  }
};

export const updateReservationStatus = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const reservation = await reservationService.updateReservationStatus(req.params.id, req.body.status, req.user.userId, restaurantId);
    sendSuccess(res, "Reservation status updated successfully", reservation);
  } catch (error) {
    next(error);
  }
};

export const deleteReservation = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    await reservationService.deleteReservation(req.params.id, restaurantId);
    sendSuccess(res, "Reservation deleted successfully");
  } catch (error) {
    next(error);
  }
};
