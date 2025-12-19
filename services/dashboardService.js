import Order from "../models/order.js";
import Bill from "../models/bill.js";
import Payment from "../models/payment.js";
import User from "../models/user.js";

// const Bill = require('../models/bill.js')
// const Order = require('../models/order.js')
// const Payment = require('../models/payment.js')

/**
 * Get today's dashboard summary
 */
export const getTodaySummary = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's orders
  const ordersToday = await Order.countDocuments({
    createdAt: { $gte: today, $lt: tomorrow }
  });

  // Today's bills
  const billsToday = await Bill.find({
    createdAt: { $gte: today, $lt: tomorrow },
    paid: true
  });

  const totalRevenue = billsToday.reduce((sum, bill) => sum + bill.total, 0);
  const totalBills = billsToday.length;
  const averageOrderValue = totalBills > 0 ? totalRevenue / totalBills : 0;

  // Payment methods breakdown
  const paymentMethods = billsToday.reduce((acc, bill) => {
    acc[bill.paymentMethod] = (acc[bill.paymentMethod] || 0) + bill.total;
    return acc;
  }, {});

  // Order status breakdown
  const orderStatuses = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const statusBreakdown = {};
  orderStatuses.forEach(item => {
    statusBreakdown[item._id] = item.count;
  });

  return {
    orders: ordersToday,
    bills: totalBills,
    revenue: totalRevenue,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    paymentMethods,
    orderStatuses: statusBreakdown
  };
};

/**
 * Get sales statistics for a date range
 */
export const getSalesStatistics = async (fromDate, toDate) => {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  // Daily sales breakdown
  const dailySales = await Bill.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        paid: true
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        totalRevenue: { $sum: "$total" },
        count: { $sum: 1 },
        averageOrder: { $avg: "$total" }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $project: {
        date: "$_id",
        revenue: { $round: ["$totalRevenue", 2] },
        orders: "$count",
        averageOrder: { $round: ["$averageOrder", 2] },
        _id: 0
      }
    }
  ]);

  // Total statistics
  const totalStats = await Bill.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        paid: true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        averageOrder: { $avg: "$total" },
        minOrder: { $min: "$total" },
        maxOrder: { $max: "$total" }
      }
    }
  ]);

  const stats = totalStats[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrder: 0,
    minOrder: 0,
    maxOrder: 0
  };

  return {
    period: {
      from: from.toISOString(),
      to: to.toISOString()
    },
    summary: {
      totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
      totalOrders: stats.totalOrders,
      averageOrder: Math.round(stats.averageOrder * 100) / 100,
      minOrder: Math.round(stats.minOrder * 100) / 100,
      maxOrder: Math.round(stats.maxOrder * 100) / 100
    },
    dailySales
  };
};

/**
 * Get top selling items
 */
export const getTopSellingItems = async (fromDate, toDate, limit = 10) => {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  const topItems = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $unwind: "$items"
    },
    {
      $group: {
        _id: "$items.name",
        quantity: { $sum: "$items.qty" },
        revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
        orders: { $addToSet: "$_id" }
      }
    },
    {
      $project: {
        itemName: "$_id",
        quantity: 1,
        revenue: { $round: ["$revenue", 2] },
        orderCount: { $size: "$orders" },
        _id: 0
      }
    },
    {
      $sort: { revenue: -1 }
    },
    {
      $limit: limit
    }
  ]);

  return topItems;
};

/**
 * Get staff performance statistics
 */
export const getStaffPerformance = async (fromDate, toDate) => {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  // Waiter performance
  const waiterStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: "$waiterId",
        orders: { $sum: 1 },
        revenue: { $sum: "$total" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "waiter"
      }
    },
    {
      $unwind: "$waiter"
    },
    {
      $project: {
        waiterId: "$_id",
        waiterName: "$waiter.name",
        waiterEmail: "$waiter.email",
        orders: 1,
        revenue: { $round: ["$revenue", 2] },
        averageOrder: { $round: [{ $divide: ["$revenue", "$orders"] }, 2] },
        _id: 0
      }
    },
    {
      $sort: { revenue: -1 }
    }
  ]);

  // Cashier performance
  const cashierStats = await Bill.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        paid: true
      }
    },
    {
      $group: {
        _id: "$cashierId",
        bills: { $sum: 1 },
        revenue: { $sum: "$total" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "cashier"
      }
    },
    {
      $unwind: "$cashier"
    },
    {
      $project: {
        cashierId: "$_id",
        cashierName: "$cashier.name",
        cashierEmail: "$cashier.email",
        bills: 1,
        revenue: { $round: ["$revenue", 2] },
        averageBill: { $round: [{ $divide: ["$revenue", "$bills"] }, 2] },
        _id: 0
      }
    },
    {
      $sort: { revenue: -1 }
    }
  ]);

  return {
    waiters: waiterStats,
    cashiers: cashierStats
  };
};

/**
 * Get payment method breakdown
 */
export const getPaymentMethodBreakdown = async (fromDate, toDate) => {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  const breakdown = await Bill.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        paid: true
      }
    },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        total: { $sum: "$total" },
        average: { $avg: "$total" }
      }
    },
    {
      $project: {
        method: "$_id",
        count: 1,
        total: { $round: ["$total", 2] },
        average: { $round: ["$average", 2] },
        _id: 0
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);

  const totalRevenue = breakdown.reduce((sum, item) => sum + item.total, 0);

  return breakdown.map(item => ({
    ...item,
    percentage: totalRevenue > 0 
      ? Math.round((item.total / totalRevenue) * 100 * 100) / 100 
      : 0
  }));
};

/**
 * Get recent activity (latest orders, bills, payments)
 */
export const getRecentActivity = async (limit = 10) => {
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('waiterId', 'name email')
    .lean();

  const recentBills = await Bill.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('orderId', 'orderNumber tableNumber')
    .populate('cashierId', 'name email')
    .lean();

  const recentPayments = await Payment.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('billId', 'billNumber total')
    .populate('processedBy', 'name email')
    .lean();

  return {
    orders: recentOrders.map(order => ({
      id: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      status: order.status,
      total: order.total,
      waiter: order.waiterId ? {
        name: order.waiterId.name,
        email: order.waiterId.email
      } : null,
      createdAt: order.createdAt
    })),
    bills: recentBills.map(bill => ({
      id: bill._id,
      billNumber: bill.billNumber,
      orderNumber: bill.orderId?.orderNumber,
      tableNumber: bill.orderId?.tableNumber,
      total: bill.total,
      paymentMethod: bill.paymentMethod,
      paid: bill.paid,
      cashier: bill.cashierId ? {
        name: bill.cashierId.name,
        email: bill.cashierId.email
      } : null,
      createdAt: bill.createdAt
    })),
    payments: recentPayments.map(payment => ({
      id: payment._id,
      paymentId: payment.paymentId,
      amount: payment.amount,
      mode: payment.mode,
      status: payment.status,
      billNumber: payment.billId?.billNumber,
      processedBy: payment.processedBy ? {
        name: payment.processedBy.name,
        email: payment.processedBy.email
      } : null,
      createdAt: payment.createdAt
    }))
  };
};

/**
 * Get dashboard overview (combines multiple statistics)
 */
export const getDashboardOverview = async (fromDate, toDate) => {
  const from = fromDate ? new Date(fromDate) : new Date();
  from.setHours(0, 0, 0, 0);
  const to = toDate ? new Date(toDate) : new Date();
  to.setHours(23, 59, 59, 999);

  // If no dates provided, get today's summary
  if (!fromDate && !toDate) {
    return await getTodaySummary();
  }

  // Get all statistics in parallel
  const [salesStats, topItems, staffPerformance, paymentBreakdown] = await Promise.all([
    getSalesStatistics(fromDate, toDate),
    getTopSellingItems(fromDate, toDate, 10),
    getStaffPerformance(fromDate, toDate),
    getPaymentMethodBreakdown(fromDate, toDate)
  ]);

  return {
    period: {
      from: from.toISOString(),
      to: to.toISOString()
    },
    sales: salesStats,
    topItems,
    staff: staffPerformance,
    paymentMethods: paymentBreakdown
  };
};

