import * as orderService from "../services/orderService.js";
import { sendSuccess, sendError } from "../utils/response.js";

// const{sendSuccess}=require('../utils/response.js')
// const orderService=require('../services/orderService.js')

export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.validated, req.user.userId, req.user.role);
    sendSuccess(res, "Order created successfully", order, 201);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {//new
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else {
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      if (restaurant) {
        restaurantId = restaurant._id;
      } else {
        const staff = await Staff.findById(req.user.userId);
        if (staff && staff.restaurantId) {
          restaurantId = staff.restaurantId;
        }
      }
    }

    // If no restaurantId, user has no restaurant. Return empty list.
    if (!restaurantId) {
      return sendSuccess(res, "Orders retrieved successfully", []);
    }

    const filters = { ...req.query, restaurantId };
    const orders = await orderService.getOrders(filters, req.user.userId, req.user.role);
    //end 
    sendSuccess(res, "Orders retrieved successfully", orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {//new
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else {
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      if (restaurant) {
        restaurantId = restaurant._id;
      } else {
        const staff = await Staff.findById(req.user.userId);
        if (staff && staff.restaurantId) {
          restaurantId = staff.restaurantId;
        }
      }
    }

    const order = await orderService.getOrderById(req.params.id, restaurantId);
   //end
    sendSuccess(res, "Order retrieved successfully", order);
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (req, res, next) => {
  try {//new
    // Resolve restaurantId (though updateOrder handles it via order ownership check, passing it enforces strict mode)
    // For brevity, we let the service handle checking if order belongs to user's restaurant via the fetched order
    // But we should fetch restaurantId to pass it if we want strict mode.
    // For now, let's assume service will check order.restaurantId matches user's.
    // Update: Let's fetch it for consistency.
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;
    let restaurantId = null;
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) restaurantId = user.restaurantId;
    else {
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      if (restaurant) restaurantId = restaurant._id;
      else {
        const staff = await Staff.findById(req.user.userId);
        if (staff) restaurantId = staff.restaurantId;
      }
    }
//new
    const order = await orderService.updateOrder(
      req.params.id,
      req.validated,
      req.user.userId,
      restaurantId
    );
    sendSuccess(res, "Order updated successfully", order);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {//new
    const { status } = req.body;
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;
    let restaurantId = null;
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) restaurantId = user.restaurantId;
    else {
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      if (restaurant) restaurantId = restaurant._id;
      else {
        const staff = await Staff.findById(req.user.userId);
        if (staff) restaurantId = staff.restaurantId;
      }
    }
//end
    const order = await orderService.updateOrderStatus(
      req.params.id,
      status,
      req.user.userId,
      req.user.role,
      restaurantId
    );
    sendSuccess(res, "Order status updated successfully", order);
  } catch (error) {
    next(error);
  }
};



export const confirmOrder = async (req, res, next) => {
  try {//new
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;
    let restaurantId = null;
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) restaurantId = user.restaurantId;
    else {
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      if (restaurant) restaurantId = restaurant._id;
      else {
        const staff = await Staff.findById(req.user.userId);
        if (staff) restaurantId = staff.restaurantId;
      }
    }
//end
    const order = await orderService.confirmOrder(
      req.params.id,
      req.user.userId,
      req.user.role,
      restaurantId
    );
    sendSuccess(res, "Order confirmed successfully", order);
  } catch (error) {
    next(error);
  }
};


//new
export const getOrdersByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;

    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) {
      restaurantId = user.restaurantId;
    } else {
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      if (restaurant) {
        restaurantId = restaurant._id;
      } else {
        const staff = await Staff.findById(req.user.userId);
        if (staff && staff.restaurantId) {
          restaurantId = staff.restaurantId;
        }
      }
    }

    if (!restaurantId) {
      return sendSuccess(res, `Orders with status '${status}' retrieved successfully`, []);
    }

    const orders = await orderService.getOrdersByStatus(status, req.user.userId, req.user.role, restaurantId);
    sendSuccess(res, `Orders with status '${status}' retrieved successfully`, orders);
  } catch (error) {
    next(error);
  }
};
//end
export const cancelOrder = async (req, res, next) => {
  try {//new
    const { reason } = req.body;
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;
    let restaurantId = null;
    const user = await User.findById(req.user.userId);
    if (user && user.restaurantId) restaurantId = user.restaurantId;
    else {
      const restaurant = await Restaurant.findByOwner(req.user.userId);
      if (restaurant) restaurantId = restaurant._id;
      else {
        const staff = await Staff.findById(req.user.userId);
        if (staff) restaurantId = staff.restaurantId;
      }
    }

    const order = await orderService.cancelOrder(
      req.params.id,
      reason,
      req.user.userId,
      restaurantId
    );
    sendSuccess(res, "Order cancelled successfully", order);
  } catch (error) {
    next(error);
  }
};
//end
