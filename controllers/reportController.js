//total new
import * as reportService from "../services/reportService.js";
import { sendSuccess } from "../utils/response.js";

import { resolveRestaurantId } from "../utils/context.js";

/**
 * Export PDF report
 */
export const exportPDF = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const filters = {
      reportType: req.query.reportType || 'all',
      dateRange: req.query.dateRange || 'This Month',
      branch: req.query.branch || 'All Branches',
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      restaurantId: restaurantId
    };

    if (!restaurantId) {
      return sendSuccess(res, "Report data generated successfully", []);
    }

    const reportData = await reportService.generateReportData(filters);

    // For now, return JSON data
    // In production, you would use a library like pdfkit or puppeteer to generate PDF
    sendSuccess(res, "Report data generated successfully", reportData);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a scheduled report
 */
export const createScheduledReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const restaurantId = await resolveRestaurantId(userId, req);

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const reportData = {
      ...req.body,
      restaurantId
    };

    const scheduledReport = await reportService.createScheduledReport(userId, reportData);

    // Update restaurant statistics
    try {
      const restaurantService = await import('../services/restaurantService.js');
      await restaurantService.incrementRestaurantStat(restaurantId, 'totalReports');
    } catch (error) {
      console.error('Error updating restaurant stats after report creation:', error);
    }

    sendSuccess(res, "Report scheduled successfully", scheduledReport, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all scheduled reports for the current user
 */
export const getScheduledReports = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reports = await reportService.getScheduledReports(userId);
    sendSuccess(res, "Scheduled reports retrieved successfully", reports);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a scheduled report
 */
export const updateScheduledReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reportId = req.params.id;
    const report = await reportService.updateScheduledReport(reportId, userId, req.body);
    sendSuccess(res, "Scheduled report updated successfully", report);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a scheduled report
 */
export const deleteScheduledReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reportId = req.params.id;
    await reportService.deleteScheduledReport(reportId, userId);
    sendSuccess(res, "Scheduled report deleted successfully");
  } catch (error) {
    next(error);
  }
};
