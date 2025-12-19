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

export const getReservationById = async (id) => {
  const reservation = await Reservation.findById(id).populate('tableId');
  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }
  return reservation;
};

export const createReservation = async (data) => {
  // Check if table exists and is available
  const table = await Table.findOne({ tableNumber: data.tableNumber });
  if (!table) {
    throw new AppError("Table not found", 404);
  }
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
export const updateReservation = async (id, data) => {
  const reservation = await Reservation.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }
  return reservation;
};

export const updateReservationStatus = async (id, status, userId) => {
  const updateData = { status };
  if (status === 'confirmed') {
    updateData.confirmedBy = userId;
  }
  if (status === 'cancelled') {
    updateData.cancelledAt = new Date();
  }
  
  const reservation = await Reservation.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }
  return reservation;
};
//new for w
export const deleteReservation = async (id) => {
  const reservation = await Reservation.findById(id);
  if (!reservation) {
    throw new AppError("Reservation not found", 404);
  }

  // Store restaurantId before deletion for stats update
  const restaurantId = reservation.restaurantId;

  await Reservation.findByIdAndDelete(id);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.decrementRestaurantStat(restaurantId, 'totalReservations');
  } catch (error) {
    console.error('Error updating restaurant stats after reservation deletion:', error);
  }

  return reservation;
};
//end

