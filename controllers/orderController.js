// import * as orderService from "../services/orderService.js";
const orderService =require("../services/orderService.js");
const { sendSuccess, sendError   } =require ("../utils/response.js");
const { resolveRestaurantId   }=require( "../utils/context.js");


exports. createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.validated, req.user.userId, req.user.role);
    sendSuccess(res, "Order created successfully", order, 201);
  } catch (error) {
    next(error);
  }
};

exports. getOrders = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);

    if (!restaurantId) {
      return sendSuccess(res, "Orders retrieved successfully", [])
    }
    const filters = { ...req.query, restaurantId };
    const orders = await orderService.getOrders(filters, req.user.userId, req.user.role);
    sendSuccess(res, "Orders retrieved successfully", orders);
  } catch (error) {
    next(error)
  }
}
exports. getOrderById = async (req, res, next) => {
  try {

    const restaurantId = await resolveRestaurantId(req.user.userId, req);

    const order = await orderService.getOrderById(req.params.id, restaurantId);
    sendSuccess(res, "Orders retrieved successfully", order);
  } catch (error) {
    next(error)
  }
}
exports. updateOrder = async (req, res, next) => {
  try {
    // Resolve restaurantId (though updateOrder handles it via order ownership check, passing it enforces strict mode)
    // For brevity, we let the service handle checking if order belongs to user's restaurant via the fetched order
    // But we should fetch restaurantId to pass it if we want strict mode.
    // For now, let's assume service will check order.restaurantId matches user's.
    // Update: Let's fetch it for consistency.

    const restaurantId = await resolveRestaurantId(req.user.userId, req);

    const order = await orderService.updateOrder(
      req.params.id,
      req.validated,
      req.user.userId,
      restaurantId
    );
    sendSuccess(res, "Order updated successfully", order);
  } catch (error) {
    next(error)

  }
};
exports. updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const restaurantId = await resolveRestaurantId(req.user.userId, req);

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



exports. confirmOrder = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);

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

exports. getOrdersByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;

    const restaurantId = await resolveRestaurantId(req.user.userId, req);

    if (!restaurantId) {
      return sendSuccess(res, `Orders with status '${status}' retrieved succwssfully`, []);
    }

    const orders = await orderService.getOrdersByStatus(status, req.user.userId, req.user.role, restaurantId);
    sendSuccess(res, `Order with status '${status}' retrieved successfully`, orders);
  } catch (error) {
    next(error);
  }
}

exports. cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const restaurantId = await resolveRestaurantId(req.user.userId, req);

    const order = await orderService.cancelOrder(
      req.params.id,
      reason,
      req.user.userId,
      restaurantId
    );
    sendSuccess(res, "Order canceled successfully", order);
  } catch (error) {
    next(error)
  }
}

