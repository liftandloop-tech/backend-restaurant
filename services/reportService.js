import Order from "../models/order.js";
import Bill from "../models/bill.js";
import Customer from "../models/customer.js";
import ScheduledReport from "../models/scheduledReport.js";
import { AppError } from "../utils/errorHandler.js";

// const {AppError} = require('../utils/errorHandler.js')
// const Bill = require('../models/bill.js')
// const Customer= require('../models/customer.js')
// const ScheduledReport = require('../models/scheduledReport.js')
// const Order = require('../models/order.js')

/**
 * Generate report data based on filters
 */
export const generateReportData = async (filters = {}) => {
  const {
    reportType = 'all',
    dateRange = 'This Month',
    branch = 'All Branches',
    fromDate,
    toDate
  } = filters;

  // Calculate date range
  let startDate, endDate;
  const now = new Date();
  
  if (fromDate && toDate) {
    startDate = new Date(fromDate);
    endDate = new Date(toDate);
  } else {
    switch (dateRange) {
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'Last 3 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'Last 6 Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
  }

  const reportData = {
    reportType,
    dateRange,
    branch,
    period: {
      from: startDate,
      to: endDate
    },
    generatedAt: new Date()
  };

  // Get orders data
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('customerId', 'name email phone');

  // Get bills data
  const bills = await Bill.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('orderId');

  // Calculate metrics
  const totalRevenue = bills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  
  // Get customer data
  const customers = await Customer.find({
    createdAt: { $gte: startDate, $lte: endDate }
  });

  reportData.metrics = {
    totalRevenue,
    totalOrders,
    completedOrders,
    totalCustomers: customers.length,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
  };

  reportData.orders = orders.map(order => ({
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total || 0,
    createdAt: order.createdAt,
    customer: order.customerId ? {
      name: order.customerId.name,
      email: order.customerId.email
    } : null
  }));

  reportData.bills = bills.map(bill => ({
    billNumber: bill.billNumber,
    orderId: bill.orderId?._id,
    grandTotal: bill.grandTotal,
    paymentMethod: bill.paymentMethod,
    createdAt: bill.createdAt
  }));

  return reportData;
};

/**
 * Create a scheduled report
 */
export const createScheduledReport = async (userId, data) => {
  // Calculate next run time
  const nextRun = calculateNextRun(data.frequency, data.time);
  
  const scheduledReport = await ScheduledReport.create({
    userId,
    ...data,
    nextRun
  });

  return scheduledReport;
};

/**
 * Get all scheduled reports for a user
 */
export const getScheduledReports = async (userId) => {
  return await ScheduledReport.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Update a scheduled report
 */
export const updateScheduledReport = async (reportId, userId, data) => {
  const report = await ScheduledReport.findOne({ _id: reportId, userId });
  
  if (!report) {
    throw new AppError("Scheduled report not found", 404);
  }

  // Recalculate next run if frequency or time changed
  if (data.frequency || data.time) {
    data.nextRun = calculateNextRun(data.frequency || report.frequency, data.time || report.time);
  }

  Object.assign(report, data);
  await report.save();
  
  return report;
};

/**
 * Delete a scheduled report
 */
export const deleteScheduledReport = async (reportId, userId) => {
  const report = await ScheduledReport.findOneAndDelete({ _id: reportId, userId });
  
  if (!report) {
    throw new AppError("Scheduled report not found", 404);
  }

  return report;
};

/**
 * Calculate next run time based on frequency and time
 */
function calculateNextRun(frequency, time) {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const nextRun = new Date();

  nextRun.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    case 'weekly':
      // Next Monday
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      nextRun.setDate(now.getDate() + daysUntilMonday);
      break;
    case 'monthly':
      // First day of next month
      nextRun.setMonth(now.getMonth() + 1, 1);
      break;
    case 'quarterly':
      // First day of next quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const nextQuarterMonth = (currentQuarter + 1) * 3;
      nextRun.setMonth(nextQuarterMonth, 1);
      if (nextQuarterMonth >= 12) {
        nextRun.setFullYear(now.getFullYear() + 1);
        nextRun.setMonth(0, 1);
      }
      break;
  }

  return nextRun;
}

