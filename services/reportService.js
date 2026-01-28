const Order = require("../models/order.js");
const Bill = require("../models/bill.js");
const Customer = require("../models/customer.js");
const ScheduledReport = require("../models/scheduledReport.js");
const Report = require("../models/report.js");
const Inventory = require("../models/inventory.js");
const Menu = require("../models/menu.js");
const Staff = require("../models/staff.js");
const Vendor = require("../models/vendor.js");
const Offer = require("../models/offer.js");
const PurchaseOrder = require("../models/purchaseOrder.js");
const { AppError } = require("../utils/errorHandler.js");
const report = require("../models/report.js");

// Generate report data based on filters 
exports.generateReportData = async (filters = {}) => {
  const {
    reportType = 'all',
    dateRange = 'This Month',
    branch = 'All Branches',
    fromDate,
    toDate,
    restaurantId
  } = filters;


  console.log("Generated report for:", { reportType, dateRange, restaurantId })
  // Calculated date range
  let startDate, endDate;
  const now = new Date();

  if (fromDate && toDate) {
    startDate = new Date(fromDate);
    endDate = new Date(toDate);
    // Adjust end date to end of day if it's just a date string or midnight
    if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
      endDate.setHours(23, 59, 59, 999);
    }

  } else {
    switch (dateRange) {
      case 'Today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;

      case 'Yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;

      case 'This Week': // Starts from Monday
        const day = now.getDay() || 7; // Get current day number, converting Sun (0) to 7
        if (day !== 1) now.setHours(-24 * (day - 1)); //Set to monday
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date() // To now;
        break;

      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 23, 59, 59);
        break;

      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 23, 59, 59);
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

      case 'All Time':
        startDate = new Date(0); //90's
        endDate = new Date(); // to now
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
    generatedAt: new Date(),
    metrics: {}
  };

  const baseQuery = {};
  if (restaurantId) {
    baseQuery.restaurantId = restaurantId;
  }
  const dateQuery = { ...baseQuery, createdAt: { $gte: startDate, $lte: endDate } };

  // Handle specific report types
  if (reportType === 'inventory') {
    const inventoryItems = await Inventory.find(baseQuery);
    reportData.data = inventoryItems;
    reportData.metrics = {
      totalItems: inventoryItems.length,
      lowStock: inventoryItems.filter(i => i.quantity <= (i.minQuantity || 10))
        .length,
      totalValue: inventoryItems.reduce((sum, i) => sum + ((i.quantity || 0) * (i.unitPrice || 0)), 0),
      outOfStock: inventoryItems.filter(i => i.quantity === 0).length
    };

  } else if (reportType === 'menu') {
    const menuItems = await Menu.find(baseQuery).populate('categoryid', 'name');
    reportData.data = menuItems;
    reportData.metrics = {
      totalItems: menuItems.length,
      activeItems: menuItems.filter(i => i.isAvailable).length,
      categories: [...new Set(menuItems.map(i => i.categoryId?.name || 'Uncategorized'))].length
    };

  } else if (reportType === 'staff') {
    const staffMembers = await Staff.find(baseQuery)
    reportData.data = staffMembers;
    reportData.metrics = {
      totalMembers: staffMembers.length,
      activeMembers: staffMembers.filter(s => s.isActive).length,
      departments: [...new Set(staffMembers.map(s => s.role))].length
    };

  } else if (reportType === 'vendor') {
    const vendors = await Vendor.find(baseQuery)
    const purchaseOrders = await PurchaseOrder.find(dateQuery);
    reportData.data = { vendors, purchaseOrders };
    reportData.metrics = {
      totalVendors: vendors.length,
      activeVendors: vendors.filter(v => v.status === 'Active').length,
      totalPurchaseOrders: purchaseOrders.length
    };

  } else if (reportType === 'offer') {
    const offers = await Offer.find({ ...baseQuery });
    reportData.data = offers;
    reportData.metrics = {
      activeOffers: offers.filter(o => o.isActive).length,
      totalRedemptions: offers.reduce((sum, o) => sum + (o.usageCount || 0), 0)
    };
  } else if (reportType === 'purchase') {
    const purchaseOrders = await PurchaseOrder.find(dateQuery).populate('vendorId', 'name contactPerson');

    const totalOrders = purchaseOrders.length;
    const totalAmount = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    const pendingOrders = purchaseOrders.filter(po => po.status === 'Pending').length;
    const completedOrders = purchaseOrders.filter(po => po.status === 'Received').length;

    reportData.metrics = {
      totalOrders,
      totalAmount,
      pendingOrders,
      completedOrders
    };
    reportData.data = purchaseOrders

  } else if (reportType === 'order') {

    //Helper to calculate order metrics for a period 
    const calculateOrderMetrics = async (start, end) => {
      const query = { ...baseQuery, createdAt: { $gte: startDate, $lte: endDate } };
      const periodOrders = await Order.find(query).populate('waiterId', 'name');

      const totalOrders = periodOrders.length;
      const totalRevenue = periodOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      const completedOrders = periodOrders.filter(o => o.status === 'completed').length;

      const cancelledOrders = periodOrders.filter(o => o.status === 'cancelled').length;

      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalOrders, totalRevenue, completedOrders, cancelledOrders,
        avgOrderValue, orders: periodOrders
      };
    }

    // 1. Currenrt Period Metrics
    const currentMetrics = await calculateOrderMetrics(startDate, endDate);

    // Previos period Determination 
    let prevStartDate, prevEndDate;
    switch (dateRange) {
      case 'Today':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        break;
      case 'Yesterday':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        break;
      case 'This Week':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 7);
        break;
      case 'This Month':
        prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setMonth(prevEndDate.getMonth() - 1);
        break;
      case 'Last Month':
        prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setMonth(prevEndDate.getMonth() - 1);
        break;
      default:
        const diff = endDate - startDate;
        prevEndDate = new Date(startDate);
        prevStartDate = new Date(prevEndDate - diff);
        break;
    }

    // 3. Previuos Period Metrics
    const prevMetrics = await calculateOrderMetrics(prevStartDate, prevEndDate);

    // 4. Calculate Trends
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    }
    const trends = {
      totalOrders: calculateChange(currentMetrics.totalOrders, prevMetrics.totalOrders),
      totalRevenue: calculateChange(currentMetrics.totalRevenue, prevMetrics.totalRevenue),
      completedOrders: calculateChange(currentMetrics.completedOrders,
        prevMetrics.completedOrders),
      cancelledOrders: calculateChange(currentMetrics.cancelledOrders, prevMetrics.cancelledOrders),
      avgOrderValue: calculateChange(currentMetrics.avgOrderValue, prevMetrics.avgOrderValue)
    };

    const orders = currentMetrics.orders;

    // Vhannel Breakdown
    const ordersByChannel = {};
    const revenueByChannel = {};

    orders.forEach(o => {
      const source = o.source || 'Other';
      ordersByChannel[source] = (ordersByChannel[source] || 0) + 1; revenueByChannel[source] = (revenueByChannel[source] || 0) + (o.total || 0);
    });
    // Top Items Calculation
    const itemMap = {};
    orders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          if (!itemMap[item.name]) {
            itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          }
          itemMap[item.name].quantity += item.qty;
          itemMap[item.name].revenue += (item.price * item.qty);
        });
      }
    });
    const topItems = Object.values(itemMap).sort((a, b) => b.quantity - a.
      quantity).slice(0, 5);

    // Average Service Time & Fastest Server (Previous Period)
    let totalTime = 0;
    let timeCount = 0;
    const serverCount = {};

    orders.forEach(o => {
      if (o.status === 'complete' && o.updateAt) {
        const diff = new Date(o.updateAt) - new Date(o.createdAt);
        if (diff > 0 && diff < 86400000) {
          totalTime += diff;
          timeCount++;
        }
      }

      if (o.waiterId && o.status === 'completed') {
        const sName = o.waiterId.name;
        serverCount[sName] = (serverCount[sName] || 0) + 1;
      }
    });

    const avgServiceTime = timeCount > 0 ? (totalTime / timeCount) / 60000 : 0;// minutes

    let fastestServer = { name: 'N/A', count: 0 };
    Object.entries(serverCount).forEach(([name, count]) => {
      if (count > fastestServer.count) fastestServer = { name, count };
    });

    reportData.metrics = {
      totalOrders: currentMetrics.totalOrders,
      totalRevenue: currentMetrics.totalRevenue,
      completedOrders: currentMetrics.completedOrders,
      cancelledOrders: currentMetrics.cancelledOrders,
      avgOrderValue: currentMetrics.avgOrderValue,
      avgServiceTimeMinutes: Math.round(avgServiceTime),
      fastestServer,
      trends // Include trends

    };

    // Charts Data
    reportData.charts = {
      orderByChannel: Object.entries(ordersByChannel).map(([name, value]) => ({ name, value })),
      revenueByChannel: Object.entries(revenueByChannel).map(([name, value]) => ({ name, value })),
    };


    reportData.data = orders;

    // Billing report logic
  } else if (reportType === 'billing') {

    // Helper to calculate billing metrics for a period
    const calculateBillingMetrics = async (start, end) => {
      const query = { ...baseQuery, createdAt: { $gte: start, $lte: end } };
      const periodBills = await Bill.find(query).populate('orderId');

      const totalBills = periodBills.length
      const totalRevenue = periodBills.reduce((sum, b) => sum + (b.total || 0),
        0);

      const completedOrders = periodBills.filter(b => b.paid).length;
      const averageBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;


      return { totalBills, totalRevenue, completedOrders, averageBillValue, bills: periodBills };
    };

    // 1. Current Period Metrics
    const currentMetrics = await calculateBillingMetrics(startDate, endDate);

    // 2. Previous Period Determination (Reusing logic)
    let prevStartDate, prevEndDate;
    switch (dateRange) {
      case 'Today':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        break;
      case 'Yesterday':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        break;
      case 'This Week':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 7);
        break;
      case 'This Month':
        prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setMonth(prevEndDate.getMonth() - 1);
        break;
      case 'Last Month':
        prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setMonth(prevEndDate.getMonth() - 1);
        break;
      default:
        const diff = endDate - startDate;
        prevEndDate = new Date(startDate);
        prevStartDate = new Date(prevEndDate - diff);
        break;
    }

    // 3. previous period Metrics
    const prevMetrics = await calculateBillingMetrics(prevStartDate, prevEndDate);

    // 4. Calculate trends
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round((current - previous / previous) * 1000) / 10;
    };

    const trends = {
      totalBill: calculateChange(currentMetrics.totalBills, prevMetrics.totalBills),
      totalRevenue: calculateChange(currentMetrics.totalRevenue, prevMetrics.totalRevenue),
      averageBillValue: calculateChange(currentMetrics.averageBillValue, prevMetrics.averageBillValue),
      completedOrders: calculateChange(currentMetrics.completedOrders, prevMetrics.completedOrders),
    };

    //payment Methods & Daily Trend (Using current period data)
    const bills = currentMetrics.bills;
    const paymentMethods = {};
    const dailyRevenue = {};

    bills.forEach(b => {
      const method = b.paymentMethod || 'unspecified';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;

      const dateStr = new Date(b.createdAt).toLocaleDateString();
      dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + (b.total || 0);
    });

    const revenueTrend = Object.entries(dailyRevenue)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    //Calculate Profit 
    //fetch purches orders for expenses
    const purchaseOrders = await PurchaseOrder.find(dateQuery);
    const totalExpenses = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);

    const netProfit = currentMetrics.totalRevenue - totalExpenses;
    const profitMargin = currentMetrics.totalRevenue > 0 ? ((netProfit / currentMetrics.totalRevenue) * 100) : 0;

    reportData.metrics = {
      totalrevenue: currentMetrics.totalRevenue,
      totalBills: currentMetrics.totalBills,
      averageBillValue: currentMetrics.averageBillValue,
      totalExpenses,
      netProfit,
      profitMargin,
      completedOrders: currentMetrics.completedOrders,
      trends
    };


    reportData.charts = {
      paymentMethod: Object.entries(paymentMethods).map(([name, value]) => ({ name, value })),
      revenueTrend
    };

    reportData.data = bills.map(bill => ({
      billNumber: bill.billNumber,
      grandTotal: bill.total,
      paymentMethod: bill.paymentMethod,
      createdAt: bill.createdAt,
      customerName: bill.orderId?.customerName || 'Walk-in',
      status: bill.paid ? 'Paid' : 'Pending'

    }));

  } else {
    // Helper to calculate metrics for a specific period
    const calculatePeriodMetrics = async (start, end) => {
      const pDateQuery = { ...baseQuery, createdAt: { $gte: start, $lte: end } };

      const orders = await Order.find(pDateQuery).populate('CustomerId', 'name email phone').populate('waiterId', 'name');
      const bills = await Bill.find(pDateQuery).populate('orderId');
      const purchaseOrders = await PurchaseOrder.find(pDateQuery);

      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      const daysDiff = Math.max(1, Math.ceil((end - start) / millisecondsPerDay));

      const totalRevenuePeriod = bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
      const totalOrdersPeriod = orders.length;

      const completedOrdersPeriod = orders.filter(o => o.status === 'completed').length;
      const totalExpensesPeriod = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);

      const uniqueCustomers = new Set();
      orders.forEach(order => {
        if (order.customerId && order.customerId._id) {
          uniqueCustomers.add(order.customerId._id.toString());
        }
      });

      const totalCustomersPeriod = uniqueCustomers.size;

      // Calculate "Daily" averages
      const dailyRevenue = Math.round(totalRevenuePeriod / daysDiff);
      const dailyOrders = Math.round(totalOrdersPeriod / daysDiff);
      const dailyCompletedOrders = Math.round(completedOrdersPeriod / daysDiff);
      const dailyCustomers = Math.round(totalCustomersPeriod / daysDiff);

      return {
        dailyRevenue,
        dailyOrders,
        dailyCompletedOrders,
        dailyCustomers,
        totalRevenuePeriod,
        totalOrdersPeriod,
        totalExpensesPeriod,
        completedOrdersPeriod,
        totalCustomersPeriod,
        orders,
        bills
      };
    };

    // Calculate Current Period Metrics
    const currentOrders = calculatePeriodMetrics(startDate, endDate);

    // Calculate Previous Period Metrics for Trends
    let prevStartDate, prevEndDate;
    // Determine previous period
    switch (dateRange) {
      case 'Today':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        break;
      case 'Yesterday':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        break;
      case 'This Week':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - 7);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(prevEndDate.getDate() - 7);
        break;
      case 'This Month':
        prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setMonth(prevEndDate.getMonth() - 1);
        break;
      case 'Last Month':
        prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setMonth(prevEndDate.getMonth() - 1);
        break;
      default:
        const diff = endDate - startDate;
        prevEndDate = new Date(startDate);
        prevStartDate = new Date(prevEndDate - diff);
        break;
    }
    const prevMetrics = await calculatePeriodMetrics(prevStartDate, prevEndDate);

    // 3.Calculate trends
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    }

    const trends = {
      totalRevenue: calculateChange(currentMetrics.totalRevenuePeriod,
        prevMetrics.totalRevenuePeriod),
      totalOrders: calculateChange(currentMetrics.totalOrdersPeriod, prevMetrics.totalOrdersPeriod),
      completedOrders: calculateChange(currentMetrics.completedOrderPeriod,
        prevMetrics.completedOrdersPeriod),
      totalCustomers: calculateChange(currentMetrics.totalCutomersPeriod,
        prevMetrics.totalCustomersPeriod),
    };

    // Channel Breakdown & Top Categaries (Using Current Period Data)
    const orders = currentMetrics.orders;
    const bills = currentMetrics.bills;

    // Channel Breakdown
    const ordersByChannel = {};
    orders.forEach(o => {
      const source = o.source || 'Dine-in';
      ordersByChannel[source] = (ordersByChannel[source] || 0) + 1;
    });

    // Top Categories
    const categoryMap = {};
    orders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(items => {
          const cat = item.category || 'Main Course';
          categoryMap[cat] = (categoryMap[cat] || 0) + (item.price * item.qty);
        });
      }
    });
    reportData.metrics = {
      totalRevenue: currentMetrics.totalRevenuePeriod,
      totalOrders: currentMetrics.totalOrdersPeriod,
      completedOrders: currentMetrics.completedOrdersPeriod,
      totalCustomers: currentMetrics.totalCustomersPeriod,
      totalExpenses: currentMetrics.totalExpensesPeriod,
      averageOrderValue: currentMetrics.totalOrdersPeriod > 0 ? currentMetrics.totalRevenuePeriod / currentMetrics.totalOrdersPeriod : 0,
      trends // Include trends
    };
    // Sales Trend Calculation
    const salesTrendMap = {};
    const isLongRange = (endDate - startDate) > (32 * 24 * 60 * 60 * 1000);
    // approx 1 month

    orders.forEach(o => {
      const d = new Date(o.createdAt);

      let key;
      if (isLongRange) {
        // Group by month
        key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else {
        // Group by day
        key = d.toLocaleString('default', { day: '2-digit', month: 'short' });
      }
      salesTrendMap[key] = (salesTrendMap[key] || 0) + (o.total || 0);
    });

    // Sort trend data
    const salesTrend = Object.entries(salesTrendMap).map(([name, value]) => ({
      name, value
    }));
    // Simple sort by date parsing might be needed if keys are strings, but for now relying on insertion order or mapped sorting if needed.
    // Better to sort by timestamp.

    // Improved sorting
    salesTrend.sort((a, b) => {
      const dateA = new Date(a.name);

      const dateB = new Date(b.name);
      return dateA - dateB;
    });
    reportData.charts = {
      ordersByChannel: Object.entries(ordersByChannel).map(([name, value]) => ({
        name, value
      })),

      topCategories: Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      salesTrend: salesTrend,
      salesVsExpenses: { sales: currentMetrics.totalRevenuePeriod, expenses: currentMetrics.totalExpensesPeriod }

    };

    reportData.orders = orders.map(order => ({
      ordernumber: order.orderNumber,
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
      grandTotal: bill.total,
      paymentMethod: bill.paymentMethod,
      createdAt: bill.createdAt
    }));
  }
  return reportData;
}

// Create a sheduled report
exports.createScheduledReport = async (userId, data) => {
  // Calculalte next run time
  const nextRun = calculateNextRun(data.frequency, data.time);


  const scheduledReport = await ScheduledReport.create({
    userId,
    ...data,
    nextRun
  });
  return scheduledReport;
};

// Get all schedule reports for a user
exports.getScheduledReports = async (userId) => {
  return (await ScheduledReport.find({ userId })).sort({ createdAt: -1 });
};

// Update a schedule reports for a user
exports.updateScheduledReports = async (reportId, userId, data) => {
  const report = await ScheduledReport.findOne({ _id: reportId, userId });

  if (!report) {
    throw new AppError("Schedule report not found", 404);
  }

  // Recalculate next run if frequency or time changed 
  if (data.frequency || data.time) {
    data.nextRun = calculateNextRun(data.frequency || report.frequency, data.time || report.time);
  };

  Object.assign(report, data);
  await report.save();

  return report;
};

// Delete a schedule report
exports.deleteShceduledReport = async (reportId, userId) => {
  const report = await ScheduledReport.findOneAndDelete({
    _id: reportId,
    userId
  });

  if (!report) {
    throw new AppError("Schedule report not found", 404);
  }
  return report;
};

// Calculate next run time based on frequency and time
function calculateNextRun(frequency, time) {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const nextRun = new Date();

  nextRun.setMinutes(hours, minutes, 0, 0);

  switch (frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    case 'weekly':
      // Next Moday
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      nextRun.setDate(now.getDate() + daysUntilMonday);
      break;

    case 'monthly':
      // First day ofNext month
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

// Save a generated report snapshot to the database
exports.saveReportSnapshot = async (reportData, userId) => {
  const report = new Report({
    restaurantId: reportData.restaurantId, // Ensure this is passed/resolved
    generatedBy: userId,
    reportType: reportData.reportType,
    dateRange: reportData.dateRange,
    period: reportData.period,
    metrics: reportData.metrics,
    charts: reportData.charts,
    data: reportData.data,
    format: 'json'
  })

  return await report.save();
};

// Get saved reports history
exports.getSavedReports = async (filters = {}) => {
  return await Report.findOne(filters).sort({ createdAt: -1 });
};