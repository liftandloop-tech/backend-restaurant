// all new for w
import mongoose from "mongoose";
import Restaurant from "../models/restaurant.js";
import User from "../models/user.js";
import Bill from "../models/bill.js";
import { AppError } from "../utils/errorHandler.js";

// const mongoose = require('mongoose');
// const Restaurant = require('../models/restaurant');
// const User = require('../models/user');
// const Bill = require('../models/bill');
// const {AppError} = require('../utils/errorHandler');

export const createRestaurant = async (restaurantData, ownerId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if owner exists and is active
    const owner = await User.findById(ownerId).session(session);
    if (!owner || !owner.isActive) {
      throw new AppError("Owner not found or inactive", 404);
    }

    // Check if owner already has a restaurant
    const existingRestaurant = await Restaurant.findOne({
      ownerId,
      isActive: true
    }).session(session);

    if (existingRestaurant) {
      throw new AppError("Owner already has an active restaurant", 400);
    }

    // Check if license key is provided and not already used
    if (restaurantData.licenseKey) {
      const licenseCheck = await Restaurant.findOne({
        licenseKey: restaurantData.licenseKey.toUpperCase(),
        isActive: true
      }).session(session);

      if (licenseCheck) {
        throw new AppError("License key already in use", 400);
      }
    }

    // Create restaurant
    const restaurant = await Restaurant.create([{
      ...restaurantData,
      ownerId,
      createdBy: ownerId,
      licenseKey: restaurantData.licenseKey?.toUpperCase(),
      licenseActivated: !!restaurantData.licenseKey
    }], { session });

    // Update owner role if necessary and set restaurantId
    if (owner.role !== 'Owner') {
      await User.findByIdAndUpdate(ownerId, { role: 'Owner', restaurantId: restaurant[0]._id }, { session });
    } else {
      await User.findByIdAndUpdate(ownerId, { restaurantId: restaurant[0]._id }, { session });
    }

    await session.commitTransaction();
    return restaurant[0];

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getRestaurantById = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId)
    .populate('ownerId', 'name email phone')
    .populate('createdBy', 'name email')
    .populate('lastUpdatedBy', 'name email');

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  return restaurant;
};

export const getRestaurantByOwner = async (ownerId) => {
  const restaurant = await Restaurant.findByOwner(ownerId)
    .populate('ownerId', 'name email phone')
    .populate('createdBy', 'name email')
    .populate('lastUpdatedBy', 'name email');

  if (!restaurant) {
    throw new AppError("Restaurant not found for this owner", 404);
  }

  return restaurant;
};

export const updateRestaurant = async (restaurantId, updateData, updatedBy) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const restaurant = await Restaurant.findById(restaurantId).session(session);
    if (!restaurant) {
      throw new AppError("Restaurant not found", 404);
    }

    // Check if license key is being changed and if it's already in use
    if (updateData.licenseKey && updateData.licenseKey.toUpperCase() !== restaurant.licenseKey) {
      const licenseCheck = await Restaurant.findOne({
        licenseKey: updateData.licenseKey.toUpperCase(),
        _id: { $ne: restaurantId },
        isActive: true
      }).session(session);

      if (licenseCheck) {
        throw new AppError("License key already in use", 400);
      }
    }

    // Update restaurant
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      {
        ...updateData,
        licenseKey: updateData.licenseKey?.toUpperCase(),
        lastUpdatedBy: updatedBy
      },
      { new: true, session }
    ).populate('ownerId', 'name email phone');

    await session.commitTransaction();
    return updatedRestaurant;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const deleteRestaurant = async (restaurantId, deletedBy) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const restaurant = await Restaurant.findById(restaurantId).session(session);
    if (!restaurant) {
      throw new AppError("Restaurant not found", 404);
    }

    // Soft delete - mark as inactive
    await Restaurant.findByIdAndUpdate(
      restaurantId,
      {
        isActive: false,
        lastUpdatedBy: deletedBy
      },
      { session }
    );

    await session.commitTransaction();
    return { message: "Restaurant deactivated successfully" };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getAllRestaurants = async (filters = {}) => {
  const query = {};

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  if (filters.isVerified !== undefined) {
    query.isVerified = filters.isVerified;
  }

  if (filters.city) {
    query['address.city'] = new RegExp(filters.city, 'i');
  }

  if (filters.state) {
    query['address.state'] = new RegExp(filters.state, 'i');
  }

  return await Restaurant.find(query)
    .populate('ownerId', 'name email phone')
    .sort({ createdAt: -1 });
};

export const addBillToRestaurantAccount = async (restaurantId, billAmount, billId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the restaurant
    const restaurant = await Restaurant.findById(restaurantId).session(session);
    if (!restaurant) {
      throw new AppError("Restaurant not found", 404);
    }

    // Update restaurant account balance and revenue
    const newBalance = restaurant.accountBalance + billAmount;
    const newTotalRevenue = restaurant.totalRevenue + billAmount;

    // Calculate monthly revenue (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const billDate = new Date();

    let newMonthlyRevenue = restaurant.monthlyRevenue;
    if (billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear) {
      newMonthlyRevenue += billAmount;
    } else {
      // Reset monthly revenue for new month
      newMonthlyRevenue = billAmount;
    }

    await Restaurant.findByIdAndUpdate(
      restaurantId,
      {
        accountBalance: newBalance,
        totalRevenue: newTotalRevenue,
        monthlyRevenue: newMonthlyRevenue,
        $inc: { totalOrders: 1 }
      },
      { session }
    );

    await session.commitTransaction();

    return {
      restaurantId,
      billAmount,
      newBalance,
      totalRevenue: newTotalRevenue,
      monthlyRevenue: newMonthlyRevenue
    };

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getRestaurantStats = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    throw new AppError("Restaurant not found", 404);
  }

  // Get additional stats from related collections
  const [
    staffCount,
    inventoryCount,
    activeOrdersCount,
    todayRevenue
  ] = await Promise.all([
    // Count active staff for this restaurant (we'll need to add restaurantId to staff model)
    User.countDocuments({ isActive: true }),
    // Count inventory items (we'll need to add restaurantId to inventory model)
    mongoose.model('Inventory').countDocuments({}),
    // Count active orders (we'll need to add restaurantId to order model)
    mongoose.model('Order').countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] } }),
    // Calculate today's revenue from bills
    Bill.aggregate([
      {
        $match: {
          paid: true,
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ])
  ]);

  return {
    restaurant: restaurant,
    stats: {
      staffCount,
      inventoryCount,
      activeOrdersCount,
      todayRevenue: todayRevenue[0]?.total || 0,
      accountBalance: restaurant.accountBalance,
      totalRevenue: restaurant.totalRevenue,
      monthlyRevenue: restaurant.monthlyRevenue,
      totalOrders: restaurant.totalOrders,
      averageOrderValue: restaurant.averageOrderValue
    }
  };
};

export const updateRestaurantLicense = async (restaurantId, licenseKey, updatedBy) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if license key is already in use
    const existingLicense = await Restaurant.findOne({
      licenseKey: licenseKey.toUpperCase(),
      _id: { $ne: restaurantId },
      isActive: true
    }).session(session);

    if (existingLicense) {
      throw new AppError("License key already in use", 400);
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      {
        licenseKey: licenseKey.toUpperCase(),
        licenseActivated: true,
        licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        lastUpdatedBy: updatedBy
      },
      { new: true, session }
    );

    if (!restaurant) {
      throw new AppError("Restaurant not found", 404);
    }

    await session.commitTransaction();
    return restaurant;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
// new for w
// Helper function to ensure user has a restaurant
export const ensureUserHasRestaurant = async (userId) => {
  const User = (await import('../models/user.js')).default;

  // First check if user already has a restaurant
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.restaurantId) {
    const restaurant = await Restaurant.findById(user.restaurantId);
    if (restaurant && restaurant.isActive) {
      return restaurant;
    }
  }

  // Check if user owns a restaurant
  const ownedRestaurant = await Restaurant.findByOwner(userId);
  if (ownedRestaurant) {
    return ownedRestaurant;
  }

  // If user is an owner/admin/manager and doesn't have a restaurant, create one
  if (['Owner', 'Admin', 'Manager'].includes(user.role)) {
    console.log('Creating default restaurant for user:', userId, user.name);

    const defaultRestaurantData = {
      name: `${user.name}'s Restaurant`,
      email: user.email,
      phone: user.mobile || '',
      description: 'Auto-created restaurant for business operations',
      address: {
        street: 'Default Address',
        city: 'Default City',
        state: 'Default State',
        country: 'India'
      },
      currency: 'INR',
      taxRate: 18
    };

    const newRestaurant = await Restaurant.create([{
      ...defaultRestaurantData,
      ownerId: user._id,
      createdBy: user._id,
      isActive: true,
      isVerified: false
    }]);

    // Update user with restaurantId
    await User.findByIdAndUpdate(user._id, { restaurantId: newRestaurant[0]._id });

    console.log('Default restaurant created:', newRestaurant[0]._id);
    return newRestaurant[0];
  }

  throw new AppError("No restaurant found for this user and insufficient permissions to create one.", 403);
};// end 
//new for w

// Functions to update restaurant statistics
export const updateRestaurantStats = async (restaurantId) => {
  try {
    // Import models dynamically to avoid circular dependencies
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Customer = (await import('../models/customer.js')).default;
    const Table = (await import('../models/table.js')).default;

    // Count active staff (both User and Staff models)
    const activeStaffCount = await Staff.countDocuments({
      restaurantId,
      isActive: true
    });

    // Count active users with roles that should be counted as staff
    const activeUserStaffCount = await User.countDocuments({
      restaurantId,
      isActive: true,
      role: { $in: ['Manager', 'Cashier', 'Waiter', 'Kitchen'] }
    });

    const totalStaff = activeStaffCount + activeUserStaffCount;

    // Count active customers
    const totalCustomers = await Customer.countDocuments({
      restaurantId,
      isActive: true
    });

    // Count all tables (regardless of status)
    const totalTables = await Table.countDocuments({
      restaurantId
    });

    // Count inventory items
    const totalInventoryItems = await mongoose.model('Inventory').countDocuments({
      restaurantId
    });

    // Count reservations
    const totalReservations = await mongoose.model('Reservation').countDocuments({
      restaurantId
    });

    // Count reports (scheduled reports)
    const totalReports = await mongoose.model('ScheduledReport').countDocuments({
      restaurantId
    });

    // Count menu items
    const totalMenuItems = await mongoose.model('MenuItem').countDocuments({
      restaurantId
    });

    // Update restaurant statistics
    await Restaurant.findByIdAndUpdate(restaurantId, {
      totalStaff,
      totalCustomers,
      totalTables,
      totalInventoryItems,
      totalReservations,
      totalReports,
      totalMenuItems
    });

    return {
      totalStaff,
      totalCustomers,
      totalTables,
      totalInventoryItems,
      totalReservations,
      totalReports,
      totalMenuItems
    };

  } catch (error) {
    console.error('Error updating restaurant stats:', error);
    throw error;
  }
};

// Helper functions to increment/decrement specific stats
export const incrementRestaurantStat = async (restaurantId, statName, amount = 1) => {
  try {
    const updateObj = {};
    updateObj[statName] = amount; // This will increment by the amount

    await Restaurant.findByIdAndUpdate(restaurantId, {
      $inc: updateObj
    });
  } catch (error) {
    console.error(`Error incrementing ${statName}:`, error);
    throw error;
  }
};

export const decrementRestaurantStat = async (restaurantId, statName, amount = 1) => {
  try {
    const updateObj = {};
    updateObj[statName] = -amount; // This will decrement by the amount

    await Restaurant.findByIdAndUpdate(restaurantId, {
      $inc: updateObj
    });
  } catch (error) {
    console.error(`Error decrementing ${statName}:`, error);
    throw error;
  }
};

// Function to recalculate all statistics for a restaurant (useful for data repair)
export const recalculateRestaurantStats = async (restaurantId) => {
  try {
    console.log(`Recalculating statistics for restaurant: ${restaurantId}`);

    // Import models dynamically to avoid circular dependencies
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Customer = (await import('../models/customer.js')).default;
    const Table = (await import('../models/table.js')).default;
    const Order = (await import('../models/order.js')).default;

    // Count active staff (both User and Staff models)
    const activeStaffCount = await Staff.countDocuments({
      restaurantId,
      isActive: true
    });

    const activeUserStaffCount = await User.countDocuments({
      restaurantId,
      isActive: true,
      role: { $in: ['Manager', 'Cashier', 'Waiter', 'Kitchen'] }
    });

    const totalStaff = activeStaffCount + activeUserStaffCount;

    // Count active customers
    const totalCustomers = await Customer.countDocuments({
      restaurantId,
      isActive: true
    });

    // Count all tables
    const totalTables = await Table.countDocuments({
      restaurantId
    });

    // Count inventory items
    const totalInventoryItems = await mongoose.model('Inventory').countDocuments({
      restaurantId
    });

    // Count reservations
    const totalReservations = await mongoose.model('Reservation').countDocuments({
      restaurantId
    });

    // Count reports (scheduled reports)
    const totalReports = await mongoose.model('ScheduledReport').countDocuments({
      restaurantId
    });

    // Count menu items
    const totalMenuItems = await mongoose.model('MenuItem').countDocuments({
      restaurantId
    });

    // Count total orders
    const totalOrders = await Order.countDocuments({
      restaurantId
    });

    // Calculate average order value
    const orderStats = await Order.aggregate([
      { $match: { restaurantId: mongoose.Types.ObjectId(restaurantId) } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' }
        }
      }
    ]);

    const totalRevenue = orderStats[0]?.totalRevenue || 0;
    const averageOrderValue = orderStats[0]?.avgOrderValue || 0;

    // Update restaurant with recalculated statistics
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      {
        totalStaff,
        totalCustomers,
        totalTables,
        totalInventoryItems,
        totalReservations,
        totalReports,
        totalMenuItems,
        totalOrders,
        totalRevenue,
        averageOrderValue
      },
      { new: true }
    );

    console.log(`Statistics recalculated for restaurant ${restaurantId}:`, {
      totalStaff,
      totalCustomers,
      totalTables,
      totalInventoryItems,
      totalReservations,
      totalReports,
      totalMenuItems,
      totalOrders,
      totalRevenue,
      averageOrderValue
    });

    return {
      totalStaff,
      totalCustomers,
      totalTables,
      totalInventoryItems,
      totalReservations,
      totalReports,
      totalMenuItems,
      totalOrders,
      totalRevenue,
      averageOrderValue
    };

  } catch (error) {
    console.error('Error recalculating restaurant stats:', error);
    throw error;
  }
};
// end
//end