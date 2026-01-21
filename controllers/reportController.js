// import * as reportService from "../services/reportService.js";
const reportService = require("../services/reportService.js");
const { sendSuccess   } =require("../utils/response.js");
const { resolveRestaurantId   }=require ("../utils/context.js");
const restaurant =require ("../models/restaurant.js");

exports. exportPDF = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req)
    const filters = {
      reportType: req.query.reportType || 'all',
      dateRange: req.query.dateRange || 'This Month',
      branch: req.query.branch || 'All Branches',
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      restaurantId: restaurantId
    }
    if (!restaurantId) {
      return sendSuccess(res, "Report data generated successfullu", [])
    }

    const reportData = await reportService.generateReportData(filters);
    // For  now ,return JSON data
    // In production, you would use a library like pdfkit or puppeteer to generate pdf
    sendSuccess(res, "Report data generated succesfully", reportData)
  } catch (error) {
    next(error);
  }
}

exports. getDashboardStats = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req)
    const filters = {
      reportType: req.query.reportType || 'all',
      dateRange: req.query.dateRange || 'This Month',
      branch: req.query.branch || 'All Branches',
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      restaurantId: restaurantId
    }
    if (!restaurantId) {
      return sendSuccess(res, "Report data generated successfullu", [])
    }

    const reportData = await reportService.generateReportData(filters);

    sendSuccess(res, "Report data generated succesfully", reportData)
  } catch (error) {
    next(error);
  }
}

exports. createScheduledReport = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const restaurantId = await resolveRestaurantId(userId, req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const reportData = {
      ...req.body,
      restaurantId
    }
    const { default: restaurantService } = await import("../services/restaurantService.js");
    await restaurantService.incrementRestaurantStat(restaurantId, 'totalReports');
  } catch (error) {
    console.error('Error updatting restaurant stats after report creation:', error)
    next(error);
  }
};

exports. getScheduledReports = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const reports = await reportService.getScheduledReports(userId);
    sendSuccess(res, "SheduleReports retrieved successfully", reports);
  } catch (error) {
    next(error);
  }
}

exports. updateScheduledReport = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const reportId = req.params.id;
    const report = await reportService.updateScheduledReport(reportId, userId, req.body);
    sendSuccess(res, "Sheduled Reports updated successfully", report);
  } catch (error) {
    next(error);
  }
}

exports. deleteScheduledReport = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const reportId = req.params.id;
    await reportService.deleteScheduledReport(reportId, userId);
    sendSuccess(res, "Sheduled Reports deleted successfully");
  } catch (error) {
    next(error);
  }
}
exports. generateAndSaveReport = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req)
    const filters = {
      reportType: req.query.reportType || 'all',
      dateRange: req.query.dateRange || 'This Month',
      branch: req.query.branch || 'All Branches',
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      restaurantId: restaurantId
    }


    //1. Generate Data
    const reportData = await reportService.generateReportData(filters);
    reportData.restaurantId = restaurantId;
    // saveSnapshot
    const savedReport = await reportService.saveReportSnapshot(reportData, req.user.userId);

    sendSuccess(res, "Report  generated and saved successfully", savedReport, 201)
  } catch (error) {
    next(error);
  }
}

exports. getArchivedReports = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const reports = await reportService.getSavedReports({ restaurantId })

    sendSuccess(res, "Archive report retrieved successfully", reports)
  } catch (error) {
    next(error);
  }
}
