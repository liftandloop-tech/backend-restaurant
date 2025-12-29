import * as kotService from "../services/kotService.js";
import { sendSuccess } from "../utils/response.js";

// const{sendSuccess}=require('../utils/response.js')
// const kotService=require('../services/kotService.js')

export const createKOT = async (req, res, next) => {
  try {
    const { orderId, station } = req.validated;

    //Get restaurantId from user
    const User = (await import('../models/user.js')).default
    const Staff = (await import('../models/staff.js')).default
    const Restaurant = (await import('../models/restaurant.js')).default

    let restaurantId = null;


    //First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;

    } else {
      //If user doesn't have restaurant check if they have the Owner
      const restaurant = await Restaurant.findByOwner(req, user.userId);
      if (restaurant) {
        restaurantId = restaurant._id;

      } else {
        //Try staff lookup as fallback 
        const staff = await Staff.findById(req.user.userId);
        if (staff && staff.restaurantId) {
          restaurantId = staff.restaurantId;
        }
      }
    }
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const kot = await kotService.createKOT(orderId, station, req.user.userId, req.user.role, restaurantId);
    sendSuccess(res, "KOT created successfully", kot, 201);
  } catch (error) {
    next(error)

  }
};


export const createKOTForOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const station = 'Kitchen';

    //Get restaurant from user
    const User = (await import('../models/user.js')).default
    const Staff = (await import('../models/staff.js')).default
    const Restaurant = (await import('../models/restaurant.js')).default

    let restaurantId = null;

    //First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;

    } else {
      //If user doesn't have restaurant check if they have the Owner
      const restaurant = await Restaurant.findByOwner(req, user.userId);
      if (restaurant) {
        restaurantId = restaurant._id;

      } else {
        //Try staff lookup as fallback 
        const staff = await Staff.findById(req.user.userId);
        if (staff && staff.restaurantId) {
          restaurantId = staff.restaurantId;
        }
      }
    }

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const kot = await kotService.createKOT(orderId, station, req.user.userId, req.user.role, restaurantId);
    sendSuccess(res, "LOT created and ready for printing", kot, 201);
  } catch (error) {
    next(error)

  }
};

export const getKOTs = async (req, res, next) => {
  try {

    //Get restaurant from user
    const User = (await import('../models/user.js')).default
    const Staff = (await import('../models/staff.js')).default
    const Restaurant = (await import('../models/restaurant.js')).default

    let restaurantId = null;

    //First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;

    } else {
      //If user doesn't have restaurant check if they have the Owner
      const restaurant = await Restaurant.findByOwner(req, user.userId);
      if (restaurant) {
        restaurantId = restaurant._id;

      } else {
        //Try staff lookup as fallback 
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

    const kots = await kotService.getKOTs(filters, req.user.role);
    sendSuccess(res, "KOTs retrieved successfully", kots);
  } catch (error) {
    next(error);
  }
};

export const getKOTById = async (req, res, next) => {
  try {
    const kot = await kotService.getKOTById(req.params.id);
    sendSuccess(res, "KOT retrieved successfully", kot);
  } catch (error) {
    next(error);
  }
};

export const updateKOTStatus = async (req, res, next) => {
  try {

    //Get restaurant from user to ensure they can only update KOTs from their restaurant
    const User = (await import('../models/user.js')).default
    const Staff = (await import('../models/staff.js')).default
    const Restaurant = (await import('../models/restaurant.js')).default

    let restaurantId = null;

    //First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;

    } else {
      //If user doesn't have restaurant check if they have the Owner
      const restaurant = await Restaurant.findByOwner(req, user.userId);
      if (restaurant) {
        restaurantId = restaurant._id;

      } else {
        //Try staff lookup as fallback 
        const staff = await Staff.findById(req.user.userId);
        if (staff && staff.restaurantId) {
          restaurantId = staff.restaurantId;
        }
      }
    }

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }
    const { status } = req.body;

    const kot = await kotService.updateKOTStatus(
      req.params.id,
      status,
      req.user.userId,
      req.user.role,
      restaurantId
    );
    sendSuccess(res, "KOT status updated successfully", kot);
  } catch (error) {
    next(error);
  }
};

export const markKOTPrinted = async (req, res, next) => {

  try {
    //Get restaurant from user 
    const User = (await import('../models/user.js')).default
    const Staff = (await import('../models/staff.js')).default
    const Restaurant = (await import('../models/restaurant.js')).default

    let restaurantId = null;

    //First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;

    } else {
      //If user doesn't have restaurant check if they have the Owner
      const restaurant = await Restaurant.findByOwner(req, user.userId);
      if (restaurant) {
        restaurantId = restaurant._id;

      } else {
        //Try staff lookup as fallback 
        const staff = await Staff.findById(req.user.userId);
        if (staff && staff.restaurantId) {
          restaurantId = staff.restaurantId;
        }
      }
    }
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const kot = await kotService.markKOTPrinted(req.params.id, req.user.userId, req.user.role, restaurantId);
    sendSuccess(res, "KOT marked as printed", kot);
  } catch (error) {
    next(error);
  }
};

export const getKOTsByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const kots = await kotService.getKOTsByStatus(status, req.user.role);
    sendSuccess(res, `KOTs with status '${status}' retrieved successfully`, kots);
  } catch (error) {
    next(error);
  }
};

export const getKOTsForOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const kots = await kotService.getKOTsForOrder(orderId, req.user.role);
    sendSuccess(res, `KOTs for order retrieved successfully`, kots);
  } catch (error) {
    next(error);
  }
};

export const updateKOTItems = async (req, res, next) => {
  try {

    const User = (await import('../models/user.js')).default
    const Staff = (await import('../models/staff.js')).default
    const Restaurant = (await import('../models/restaurant.js')).default

    let restaurantId = null;

    //First try to get restaurantId from the user model
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;

    } else {
      //If user doesn't have restaurant check if they have the Owner
      const restaurant = await Restaurant.findByOwner(req, user.userId);
      if (restaurant) {
        restaurantId = restaurant._id;

      } else {
        //Try staff lookup as fallback 
        const staff = await Staff.findById(req.user.userId);
        if (staff && staff.restaurantId) {
          restaurantId = staff.restaurantId;
        }
      }
    }
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }
    const { id } = req.params;
    const { items } = req.body;
    const kot = await kotService.updateKOTItems(id, items, req.user.userId, req.user.role, restaurantId);
    sendSuccess(res, "KOT items updated successfully", kot);
  } catch (error) {
    next(error);
  }
};

