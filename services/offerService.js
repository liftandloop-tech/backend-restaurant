import Offer from "../models/offer.js";
import { AppError } from "../utils/errorHandler.js";

// const Offer =require('models/offer.js')
// const{AppError}=require('../utils/errorHandler.js')

export const getOffers = async (filters = {}) => {
  const query = {};
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;

  const now = new Date();
  if (filters.activeOnly) {
    query.isActive = true;
    query.validFrom = { $lte: now };
    query.validUntil = { $gte: now };
  }

  return await Offer.find(query).populate('applicableItems applicableCategories').sort({ createdAt: -1 });
};
//new
export const getOfferById = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const offer = await Offer.findOne(query).populate('applicableItems applicableCategories');
  if (!offer) {
    throw new AppError("Offer not found", 404);
  }
  return offer;
};
//end
export const createOffer = async (data) => {
  return await Offer.create(data);
};

export const updateOffer = async (id, data, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const offer = await Offer.findOneAndUpdate(query, data, { new: true, runValidators: true });
  //end
  if (!offer) {
    throw new AppError("Offer not found", 404);
  }
  return offer;
};
//new
export const updateOfferStatus = async (id, isActive, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const offer = await Offer.findOneAndUpdate(query, { isActive }, { new: true });
  if (!offer) {
    throw new AppError("Offer not found", 404);
  }
  return offer;
};

export const deleteOffer = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const offer = await Offer.findOneAndDelete(query);
  if (!offer) {
    throw new AppError("Offer not found", 404);
  }
  return offer;
};
//end
