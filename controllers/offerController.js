//total new
// import * as offerService from "../services/offerService.js";
const offerService = require("../services/offerService.js");
const { sendSuccess   } =require ("../utils/response.js");

// Helper to resolve restaurantId
const resolveRestaurantId = async (userId) => {
  // Dynamic imports to avoid potential circular dependency issues
  const { default: User } = await import("../models/user.js");
  const { default: Staff } = await import("../models/staff.js");
  const { default: Restaurant } = await import("../models/restaurant.js");

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

exports. getOffers = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const filters = {
      ...req.query,
      restaurantId: restaurantId
    };

    if (!restaurantId) {
      return sendSuccess(res, "Offers retrieved successfully", []);
    }

    const offers = await offerService.getOffers(filters);
    sendSuccess(res, "Offers retrieved successfully", offers);
  } catch (error) {
    next(error);
  }
};

exports. getOfferById = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const offer = await offerService.getOfferById(req.params.id, restaurantId);
    sendSuccess(res, "Offer retrieved successfully", offer);
  } catch (error) {
    next(error);
  }
};

exports. createOffer = async (req, res, next) => {
  try {
    // Ensure user has a restaurant
    const restaurantService = (require("../services/restaurantService.js"));
    const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId);

    const offerData = {
      ...req.body,
      restaurantId: restaurant._id
    };

    const offer = await offerService.createOffer(offerData);
    sendSuccess(res, "Offer created successfully", offer, 201);
  } catch (error) {
    next(error);
  }
};

exports. updateOffer = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const offer = await offerService.updateOffer(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Offer updated successfully", offer);
  } catch (error) {
    next(error);
  }
};

exports. updateOfferStatus = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const offer = await offerService.updateOfferStatus(req.params.id, req.body.isActive, restaurantId);
    sendSuccess(res, "Offer status updated successfully", offer);
  } catch (error) {
    next(error);
  }
};

exports. deleteOffer = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    await offerService.deleteOffer(req.params.id, restaurantId);
    sendSuccess(res, "Offer deleted successfully");
  } catch (error) {
    next(error);
  }
};
