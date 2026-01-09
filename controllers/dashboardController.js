import * as dashboardService from "../services/dashboardService.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/errorHandler.js";
import { resolveRestaurantId } from "../utils/context.js";

export const getTodaySummary = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return sendSuccess(res, "Today's summery retrieved successfully", {
        totalSales: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        customers: 0
      });
    }
    const summery = await dashboardService.getTodaySummary(restaurantId);
    sendSuccess(res, "Today summery retrieved successfully", summery);
  } catch (error) {
    next(error);
  }
}

export const getSalesStatistics = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      throw new AppError("both 'from' and 'to' date parametters are required", 400);

    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new AppError("Invalid date format. Use YYY-MM-DD format", 400);
    }

    if (fromDate > toDate) {
      throw new AppError("'from' date must be before 'to' date", 400)
    }

    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return sendSuccess(res, "Sales statistics retrieved successfully", []);
    }
    const statistics = await dashboardService.getSalesStatistics(from, to, restaurantId);
    sendSuccess(res, "Sales statistics retrieved successfully", statistics);
  } catch (error) {
    next(error);
  }
};

export const getTopSellingItems = async (req, res, next) => {
  try {
    const { from, to, limit = 10 } = req.query;
    if (!from || !to) {
      throw new AppError("Both 'from' and  'to' date parameters are required")
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new AppError("Invalid date format. Use YYYY-MM-DD format", 400);
    }
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new AppError("limit must be a number between 1 and 100", 400)
    }

    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return sendSuccess(res, "Top selling items retrieved successfully", []);
    }
    const topItems = await dashboardService.getTopSellingItems(from, to, limitNum, restaurantId);
    sendSuccess(res, "Top selling itmes retrieved successfully", topItems);
  } catch (error) {
    next(error);
  }
};

export const getStaffPerformance = async (req, res, next) => {
  try {
    const { from, to, } = req.query;
    if (!from || !to) {
      throw new AppError("Both 'from' and  'to' date parameters are required", 400)
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNAN(fromDate.getTime()) || isNAN(toDate.getTime())) {
      throw new AppError("Invalid date format. Use YYYY-MM-DD format", 400);
    }
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return sendSuccess(res, "Staff performance retrieved successfully", []);
    }
    const performance = await dashboardService.getStaffPerformance(from, to, restaurantId);
    sendSuccess(res, "Staff performance retrieved successfully", performance);
  } catch (error) {
    next(error);
  }
};


export const getPaymentMethodBreakdown = async (req, res, next) => {
  try {
    const { from, to, } = req.query;
    if (!from || !to) {
      throw new AppError("Both 'from' and  'to' date parameters are required", 400)
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNAN(fromDate.getTime()) || isNAN(toDate.getTime())) {
      throw new AppError("Invalid date format. Use YYYY-MM-DD format", 400);
    }

    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return sendSuccess(res, "Payment method breakdown retrieved successfully", []);
    }

    const breakdown = await dashboardService.getPaymentMethodBreakdown(from, to, restaurantId);
    sendSuccess(res, "Payment method breakdown retrieved successfully", breakdown);
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      throw new AppError("Limit must be a number between 1 and 50", 400);
    }
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return sendSuccess(res, "Recent activity retrieved successfully", []);
    }
    const activity = await dashboardService.getRecentActivity(limitNum, restaurantId);
    sendSuccess(res, "Recent activity retrieved successfully", activity);
  } catch (error) {
    next(error);
  }
};

export const getDashboardOverview = async (req, res, next) => {
  try {
    const { from, to, } = req.query;
    if (!from || !to) {
      throw new AppError("Both 'from' and  'to' date parameters are required when specifying date range", 400)
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNAN(fromDate.getTime()) || isNAN(toDate.getTime())) {
      throw new AppError("Invalid date format. Use YYYY-MM-DD format", 400);
    }
    if (fromDate > toDate) {
      throw new AppError("from date bust be before to date", 400)
    }

    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return sendSuccess(res, "Dashboard overview retrieved successfully", {
        today: { totalSales: 0, totalOrders: 0, Customer: 0 },
        salesTrend: [],
        topItems: [],
        staffPerformance: [],
        paymentMethods: [],
        recentActivity: []
      });
    }
    const overview = await dashboardService.getDashboardOverview(from, to, restaurantId);
    sendSuccess(res, "Dahsboard overview retrieved successfully", overview);
  } catch (error) {
    next(error);
  }
};
