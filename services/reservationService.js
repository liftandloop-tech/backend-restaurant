import Reservation from "../models/reservation.js";
import Table from "../models/table.js";
import { AppError } from "../utils/errorHandler.js";


// const Reservation = require('../models/reservation.js')
// const Table = require('../models/table.js')
// const {AppError}= require('../utils/errorHandler.js')

export const getReservations = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.reservationDate) {
    const date = new Date(filters.reservationDate);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    query.reservationDate = { $gte: date, $lt: nextDay };
  }
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await Reservation.find(query).populate('tableId').sort({ reservationDate: -1 });
};
//new
export const getReservationById = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const reservation = await Reservation.findOne(query).populate('tableId');
  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }
  return reservation;
};

export const createReservation = async (data) => {
  // Check if table exists and is available in the specific restaurant
  const table = await Table.findOne({ tableNumber: data.tableNumber, restaurantId: data.restaurantId });
  if (!table) {
    throw new AppError("Table not found in this restaurant", 404);
  }//end
  // new for w

  data.tableId = table._id;
  const reservation = await Reservation.create(data);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.incrementRestaurantStat(data.restaurantId, 'totalReservations');
  } catch (error) {
    console.error('Error updating restaurant stats after reservation creation:', error);
  }

  return reservation;
};
// end
//new
export const updateReservation = async (id, data, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const reservation = await Reservation.findOneAndUpdate(query, data, { new: true, runValidators: true });
  //end
  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }
  return reservation;
};

export const updateReservationStatus = async (id, status, userId,restaurantId) => {
  const updateData = { status };
  if (status === 'confirmed') {
    updateData.confirmedBy = userId;
  }
  if (status === 'cancelled') {
    updateData.cancelledAt = new Date();
  }
//new
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const reservation = await Reservation.findOneAndUpdate(query, updateData, { new: true, runValidators: true });
  //end
  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }
  return reservation;
};
//new for w
export const deleteReservation = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const reservation = await Reservation.findOne(query);
  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }

  // Store restaurantId before deletion for stats update
  const itemRestaurantId = reservation.restaurantId;

  await Reservation.findByIdAndDelete(id);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.decrementRestaurantStat(itemRestaurantId, 'totalReservations');
  } catch (error) {
    console.error('Error updating restaurant stats after reservation deletion:', error);
  }

  return reservation;
};
//end

