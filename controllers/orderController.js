import * as orderService from "../services/orderService.js";
import { sendSuccess, sendError } from "../utils/response.js";

// const{sendSuccess}=require('../utils/response.js')
// const orderService=require('../services/orderService.js')

export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.validated, req.user.userId,req.user.role);
    sendSuccess(res, "Order created successfully", order, 201);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrders(req.query,req.user.userId,req.user.role);
    sendSuccess(res, "Orders retrieved successfully", orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    sendSuccess(res, "Order retrieved successfully", order);
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    const order = await orderService.updateOrder(
      req.params.id,
      req.validated,
      req.user.userId
    );
    sendSuccess(res, "Order updated successfully", order);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(
      req.params.id,
      status,
      req.user.userId,
      req.user.role
    );
    sendSuccess(res, "Order status updated successfully", order);
  } catch (error) {
    next(error);
  }
};



export const confirmOrder = async (req, res, next) => {
  try{
    const order = await orderService.confirmOrder(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    sendSuccess(res, "Order confirmed successfully", order);
  }catch(error){
    next(error);
  }
};



export const getOrdersByStatus = async(req,res,next) => {
  try{
    const {status} = req.params;
    const orders = await orderService.getOrdersByStatus(status, req.user.userId,req.user.role);
    sendSuccess(res, `Orders with status'${status}' retrieved successfully`,orders);
  }catch(error){
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await orderService.cancelOrder(
      req.params.id,
      reason,
      req.user.userId
    );
    sendSuccess(res, "Order cancelled successfully", order);
  } catch (error) {
    next(error);
  }
};

