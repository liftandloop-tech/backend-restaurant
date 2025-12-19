import Offer from "../models/offer.js";
import { AppError } from "../utils/errorHandler.js";

// const Offer =require('models/offer.js')
// const{AppError}=require('../utils/errorHandler.js')

export const getOffers = async (filters = {}) => {
  const query = {};
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  
  const now = new Date();
  if (filters.activeOnly) {
    query.isActive = true;
    query.validFrom = { $lte: now };
    query.validUntil = { $gte: now };
  }
  
  return await Offer.find(query).populate('applicableItems applicableCategories').sort({ createdAt: -1 });
};

export const getOfferById = async (id) => {
  const offer = await Offer.findById(id).populate('applicableItems applicableCategories');
  if (!offer) {
    throw new AppError("Offer not found", 404);
  }
  return offer;
};

export const createOffer = async (data) => {
  return await Offer.create(data);
};

export const updateOffer = async (id, data) => {
  const offer = await Offer.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!offer) {
    throw new AppError("Offer not found", 404);
  }
  return offer;
};

export const updateOfferStatus = async (id, isActive) => {
  const offer = await Offer.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!offer) {
    throw new AppError("Offer not found", 404);
  }
  return offer;
};

export const deleteOffer = async (id) => {
  const offer = await Offer.findByIdAndDelete(id);
  if (!offer) {
    throw new AppError("Offer not found", 404);
  }
  return offer;
};

