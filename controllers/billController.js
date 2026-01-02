//total new
import * as billingService from "../services/billingService.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/errorHandler.js";

import { resolveRestaurantId } from "../utils/context.js";

export const createBill = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { idempotencyKey } = req.body;
    const bill = await billingService.createBill(orderId, req.user.userId, idempotencyKey, req.user.role);
    sendSuccess(res, "Bill created successfully", bill, 201);
  } catch (error) {
    next(error);
  }
};

export const processPayment = async (req, res, next) => {
  try {
    const { billId } = req.params;
    const { paymentMethod, transactionId, gatewayResponse, idempotencyKey } = req.validated;

    const result = await billingService.processPayment(
      billId,
      { paymentMethod, transactionId, gatewayResponse },
      req.user.userId,
      idempotencyKey
    );

    sendSuccess(res, "Payment processed successfully", result);
  } catch (error) {
    next(error);
  }
};

export const getBills = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return sendSuccess(res, "Bills retrieved successfully", []);
    }
    const filters = req.query;
    if (restaurantId) {
      filters.restaurantId = restaurantId;
    }
    const bills = await billingService.getBills(filters);
    sendSuccess(res, "Bills retrieved successfully", bills);
  } catch (error) {
    next(error);
  }
};

export const getBillById = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const bill = await billingService.getBillById(req.params.id, restaurantId);
    sendSuccess(res, "Bill retrieved successfully", bill);
  } catch (error) {
    next(error);
  }
};

export const processRefund = async (req, res, next) => {
  try {
    const { billId } = req.params;
    const { refundAmount, reason } = req.body;
    const restaurantId = await resolveRestaurantId(req.user.userId, req);

    const bill = await billingService.processRefund(
      billId,
      refundAmount,
      reason,
      req.user.userId,
      restaurantId
    );

    sendSuccess(res, "Refund processed successfully", bill);
  } catch (error) {
    next(error);
  }
};
export const printBill = async (req, res, next) => {
  try {
    const { billId } = req.params;
    const restaurantId = await resolveRestaurantId(req.user.userId, req);

    // Get bill with populated order and cashier data
    const bill = await billingService.getBillById(billId, restaurantId);

    if (!bill) {
      throw new AppError("Bill not found", 404);
    }

    // Import BillPrinter dynamically to avoid circular dependencies
    const { default: BillPrinter } = await import("../printers/billPrinter.js");

    // Create printer instance
    const printer = new BillPrinter();

    // Print the bill (this will log the print job in development)
    const printResult = await printer.printBill(bill);


    //Remove KOTs associated with this order after bill is printed
    try {
      const KOT = (await import("../models/KOT.js")).default;
      await KOT.deleteMany({ orderId: bill.orderId._id });
      console.log(`Removed ${await KOT.countDocuments({ orderId: bill.orderId._id })} KOTs for order ${bill.orderId.orderNumber}`);

    } catch (kotError) {
      console.error('Failed to remove KOTs after bill printing:', kotError);
      //Dont fail bill printing if KOT removal fails 
    }
    sendSuccess(res, "Bill printed successfully", {
      billId: bill._id,
      billNumber: bill.billNumber,
      printResult
    });
  } catch (error) {
    next(error);
  }
};

export const getBillsByCashier = async (req, res, next) => {
  try {
    const { cashierId } = req.params;
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return sendSuccess(res, "Bills retrieved successfully", []);
    }
    const bills = await billingService.getBillsByCashier(req.user.userId, req.user.role, restaurantId)
    sendSuccess(res, "Bills retrieved successfully", bills);
  } catch (error) {
    next(error);
  }
};
