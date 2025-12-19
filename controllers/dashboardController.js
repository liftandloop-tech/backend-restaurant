import * as dashboardService from "../services/dashboardService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { AppError } from "../utils/errorHandler.js";

// const{sendSuccess}=require('../utils/response.js')
// const dashboardService=require('../services/dashboardService.js')
// const{AppError}=require('../utils/errorHandler.js')

/**
 * Get today's dashboard summary
 * GET /api/v1/dashboard/today
 */
export const getTodaySummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getTodaySummary();
    sendSuccess(res, "Today's summary retrieved successfully", summary);
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales statistics for a date range
 * GET /api/v1/dashboard/sales?from=2025-01-01&to=2025-01-31
 */
export const getSalesStatistics = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      throw new AppError("Both 'from' and 'to' date parameters are required", 400);
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new AppError("Invalid date format. Use YYYY-MM-DD format", 400);
    }

    if (fromDate > toDate) {
      throw new AppError("'from' date must be before 'to' date", 400);
    }

    const statistics = await dashboardService.getSalesStatistics(from, to);
    sendSuccess(res, "Sales statistics retrieved successfully", statistics);
  } catch (error) {
    next(error);
  }
};

/**
 * Get top selling items
 * GET /api/v1/dashboard/top-items?from=2025-01-01&to=2025-01-31&limit=10
 */
export const getTopSellingItems = async (req, res, next) => {
  try {
    const { from, to, limit = 10 } = req.query;
    
    if (!from || !to) {
      throw new AppError("Both 'from' and 'to' date parameters are required", 400);
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new AppError("Invalid date format. Use YYYY-MM-DD format", 400);
    }

    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new AppError("Limit must be a number between 1 and 100", 400);
    }

    const topItems = await dashboardService.getTopSellingItems(from, to, limitNum);
    sendSuccess(res, "Top selling items retrieved successfully", topItems);
  } catch (error) {
    next(error);
  }
};

/**
 * Get staff performance statistics
 * GET /api/v1/dashboard/staff?from=2025-01-01&to=2025-01-31
 */
export const getStaffPerformance = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      throw new AppError("Both 'from' and 'to' date parameters are required", 400);
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new AppError("Invalid date format. Use YYYY-MM-DD format", 400);
    }

    const performance = await dashboardService.getStaffPerformance(from, to);
    sendSuccess(res, "Staff performance retrieved successfully", performance);
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment method breakdown
 * GET /api/v1/dashboard/payments?from=2025-01-01&to=2025-01-31
 */
export const getPaymentMethodBreakdown = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      throw new AppError("Both 'from' and 'to' date parameters are required", 400);
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new AppError("Invalid date format. Use YYYY-MM-DD format", 400);
    }

    const breakdown = await dashboardService.getPaymentMethodBreakdown(from, to);
    sendSuccess(res, "Payment method breakdown retrieved successfully", breakdown);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity
 * GET /api/v1/dashboard/recent?limit=10
 */
export const getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      throw new AppError("Limit must be a number between 1 and 50", 400);
    }

    const activity = await dashboardService.getRecentActivity(limitNum);
    sendSuccess(res, "Recent activity retrieved successfully", activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Get comprehensive dashboard overview
 * GET /api/v1/dashboard/overview?from=2025-01-01&to=2025-01-31
 */
export const getDashboardOverview = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    
    // If dates provided, validate them
    if (from || to) {
      if (!from || !to) {
        throw new AppError("Both 'from' and 'to' date parameters are required when specifying date range", 400);
      }

      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new AppError("Invalid date format. Use YYYY-MM-DD format", 400);
      }

      if (fromDate > toDate) {
        throw new AppError("'from' date must be before 'to' date", 400);
      }
    }

    const overview = await dashboardService.getDashboardOverview(from, to);
    sendSuccess(res, "Dashboard overview retrieved successfully", overview);
  } catch (error) {
    next(error);
  }
};

