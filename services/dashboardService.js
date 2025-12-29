import Order from "../models/order.js";
import Bill from "../models/bill.js";
import Payment from "../models/payment.js";
import User from "../models/user.js";
//new
import KOT from "../models/KOT.js";
import Table from "../models/table.js";

/**
 * Get today's dashboard summary with yesterday's comparison
 */
export const getTodaySummary = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
//new for w
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Today's metrics helper function
  const getMetrics = async (startDate, endDate) => {
    // Orders
    const orders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });

    // Bills
    const bills = await Bill.find({
      createdAt: { $gte: startDate, $lt: endDate },
      paid: true
    });

    const revenue = bills.reduce((sum, bill) => sum + bill.total, 0);
    const billCount = bills.length;
    const avgOrderValue = billCount > 0 ? revenue / billCount : 0;

    // KOT Prep Time
    const completedKots = await KOT.find({
      completedAt: { $gte: startDate, $lt: endDate },
      startedAt: { $exists: true }
    });

    let totalPrepTime = 0;
    completedKots.forEach(kot => {
      const diff = new Date(kot.completedAt) - new Date(kot.startedAt);
      totalPrepTime += diff / (1000 * 60);
    });
    const avgKotPrepTime = completedKots.length > 0 ? totalPrepTime / completedKots.length : 0;

    // Dining Time
    const completedDineIn = await Order.find({
      createdAt: { $gte: startDate, $lt: endDate },
      status: 'completed',
      source: 'dine-in'
    });

    let totalDiningTime = 0;
    completedDineIn.forEach(order => {
      const diff = new Date(order.updatedAt) - new Date(order.createdAt);
      totalDiningTime += diff / (1000 * 60);
    });
    const avgDiningTime = completedDineIn.length > 0 ? totalDiningTime / completedDineIn.length : 0;

    return { orders, revenue, avgOrderValue, avgKotPrepTime, avgDiningTime, billCount };
  };

  const todayMetrics = await getMetrics(today, tomorrow);
  const yesterdayMetrics = await getMetrics(yesterday, today);

  // Calculate trends
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  };

  // Order status breakdown (Today only)
  //end 
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
//new for w
  // Low stock items
  const lowStockItems = await KOT.find({}).then(async () => {
    try {
      const inventoryService = await import('../services/inventoryService.js');
      return await inventoryService.getLowStockItems();
    } catch (e) {
      return [];
    }
  });

  // Payment methods breakdown (Today)
  const billsToday = await Bill.find({
    createdAt: { $gte: today, $lt: tomorrow },
    paid: true
  });
  const paymentMethods = billsToday.reduce((acc, bill) => {
    acc[bill.paymentMethod] = (acc[bill.paymentMethod] || 0) + bill.total;
    return acc;
  }, {});

  return {
    orders: todayMetrics.orders,
    bills: todayMetrics.billCount,
    revenue: todayMetrics.revenue,
    averageOrderValue: Math.round(todayMetrics.avgOrderValue * 100) / 100,
    avgKotPrepTime: Math.round(todayMetrics.avgKotPrepTime * 10) / 10,
    avgDiningTime: Math.round(todayMetrics.avgDiningTime * 10) / 10,
    trends: {
      revenue: calculateChange(todayMetrics.revenue, yesterdayMetrics.revenue),
      averageOrderValue: calculateChange(todayMetrics.avgOrderValue, yesterdayMetrics.avgOrderValue),
      avgKotPrepTime: calculateChange(todayMetrics.avgKotPrepTime, yesterdayMetrics.avgKotPrepTime),
      avgDiningTime: calculateChange(todayMetrics.avgDiningTime, yesterdayMetrics.avgDiningTime)
    },
    paymentMethods,
    orderStatuses: statusBreakdown,
    lowStockItems: lowStockItems.slice(0, 5) // Top 5 critical items
  };
};
//end 
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

