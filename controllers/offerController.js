import * as offerService from "../services/offerService.js";
import { sendSuccess } from "../utils/response.js";

// const{sendSuccess}=require('../utils/response.js')
// const offerService=require('../services/offerService.js')

export const getOffers = async (req, res, next) => {
  try {
    const offers = await offerService.getOffers(req.query);
    sendSuccess(res, "Offers retrieved successfully", offers);
  } catch (error) {
    next(error);
  }
};

export const getOfferById = async (req, res, next) => {
  try {
    const offer = await offerService.getOfferById(req.params.id);
    sendSuccess(res, "Offer retrieved successfully", offer);
  } catch (error) {
    next(error);
  }
};

export const createOffer = async (req, res, next) => {
  try {
    const offer = await offerService.createOffer(req.body);
    sendSuccess(res, "Offer created successfully", offer, 201);
  } catch (error) {
    next(error);
  }
};

export const updateOffer = async (req, res, next) => {
  try {
    const offer = await offerService.updateOffer(req.params.id, req.body);
    sendSuccess(res, "Offer updated successfully", offer);
  } catch (error) {
    next(error);
  }
};

export const updateOfferStatus = async (req, res, next) => {
  try {
    const offer = await offerService.updateOfferStatus(req.params.id, req.body.isActive);
    sendSuccess(res, "Offer status updated successfully", offer);
  } catch (error) {
    next(error);
  }
};

export const deleteOffer = async (req, res, next) => {
  try {
    await offerService.deleteOffer(req.params.id);
    sendSuccess(res, "Offer deleted successfully");
  } catch (error) {
    next(error);
  }
};

