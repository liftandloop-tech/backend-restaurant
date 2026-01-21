// //total new
// import * as reservationService from "../services/reservationService.js";
const reservationService = require("../services/reservationService.js");
const { sendSuccess   } =require ("../utils/response.js");

const { resolveRestaurantId   } =require ("../utils/context.js");

exports. getReservations = async (req, res, next) => {
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

exports. getReservationById = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const reservation = await reservationService.getReservationById(req.params.id, restaurantId);
    sendSuccess(res, "Reservation retrieved successfully", reservation);
  } catch (error) {
    next(error);
  }
};

exports. createReservation = async (req, res, next) => {
  try {
    // Ensure user has a restaurant (create one if needed)
    const restaurantService = (require("../services/restaurantService.js"));
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

exports. updateReservation = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const reservation = await reservationService.updateReservation(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Reservation updated successfully", reservation);
  } catch (error) {
    next(error);
  }
};

exports. updateReservationStatus = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const reservation = await reservationService.updateReservationStatus(req.params.id, req.body.status, req.user.userId, restaurantId);
    sendSuccess(res, "Reservation status updated successfully", reservation);
  } catch (error) {
    next(error);
  }
};

exports. deleteReservation = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    await reservationService.deleteReservation(req.params.id, restaurantId);
    sendSuccess(res, "Reservation deleted successfully");
  } catch (error) {
    next(error);
  }
};
