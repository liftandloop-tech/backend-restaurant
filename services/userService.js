import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import User from "../models/user.js";
import { AppError } from "../utils/errorHandler.js";
import { addToBlacklist } from "../middlewares/auth.js";
import { ROLES } from "../middlewares/roles.js";

// const jwt = require('jsonwebtoken')
// const {ENV} = require('../config/env.js')
// const User= require('../models/user.js')
// const {AppError}= require('../utils/errorHandler.js')
// const {ROLES} = require('../middlewares/roles.js')
// const {addToBlacklist}=require('../middlewares/auth.js')

export const registerUser = async (userData) => {
  const { email, password, name, role } = userData;
  
  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }
  
  // Create user
  const user = await User.create({
    email,
    password,
    name,
    role
  });
  
  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  // Save refresh token
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  
  return {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    accessToken,
    refreshToken
  };
};

export const loginUser = async (email, password, ) => {
  // Find user by email only (mobile is optional)
  const user = await User.findOne({ email }).select('+password +refreshToken +refreshTokenExpiry');
  
  if (!user || !await user.comparePassword(password)) {
    throw new AppError("Invalid email or password", 401);
  }
  
  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }
  
  // Update last login
  user.lastLogin = new Date();
  
  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  // Save refresh token
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  
  // Return login data
  const result = {
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    accessToken,
    refreshToken
  };

  console.log('Backend loginUser returning:', {
    hasUser: !!result.user,
    hasAccessToken: !!result.accessToken,
    hasRefreshToken: !!result.refreshToken
  });

  return result;
}

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token required", 401);
  }
  
  const decoded = jwt.verify(refreshToken, ENV.JWT_SECRET);
  const user = await User.findById(decoded.userId).select('+refreshToken +refreshTokenExpiry');
  
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError("Invalid refresh token", 401);
  }
  
  if (user.refreshTokenExpiry < new Date()) {
    throw new AppError("Refresh token expired", 401);
  }
  
  const accessToken = generateAccessToken(user);
  
  return { accessToken };
};

export const logoutUser = async (userId, token) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshToken = undefined;
    user.refreshTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
  }
  
  // Add token to blacklist
  if (token) {
    addToBlacklist(token);
  }
};

export const getAllUsers = async (filters = {}) => {
  const query = {};
  if (filters.role) query.role = filters.role;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  
  return await User.find(query).select('-password -refreshToken').sort({ createdAt: -1 });
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken');
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};

export const updateProfile = async (userId, updateData) => {
  const allowedFields = ['name', 'mobile', 'email'];
  const updateFields = {};
  
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields[key] = updateData[key];
    }
  });
  
  if (Object.keys(updateFields).length === 0) {
    throw new AppError("No valid fields to update", 400);
  }
  
  // Check if email is being updated and if it's already taken
  if (updateFields.email) {
    const existingUser = await User.findOne({ email: updateFields.email, _id: { $ne: userId } });
    if (existingUser) {
      throw new AppError("Email already in use", 409);
    }
  }
  
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');
  
  if (!user) {
    throw new AppError("User not found", 404);
  }
  
  return user;
};

export const updateUserRole = async (targetUserId, newRole, actingUser) => {
  const allowedRoles = Object.values(ROLES);
  if (!allowedRoles.includes(newRole)) {
    throw new AppError("Invalid role supplied", 400);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError("User not found", 404);
  }

  if (targetUser._id.toString() === actingUser.userId) {
    throw new AppError("You cannot change your own role", 400);
  }

  if (targetUser.role === ROLES.OWNER && actingUser.role !== ROLES.OWNER) {
    throw new AppError("Only the Owner can change another Owner's role", 403);
  }
// new for w
  const oldRole = targetUser.role;
  targetUser.role = newRole;
  await targetUser.save({ validateBeforeSave: false });

  // Update restaurant statistics if role change affects staff count
  const staffRoles = ['Manager', 'Cashier', 'Waiter', 'Kitchen'];
  const wasStaff = staffRoles.includes(oldRole);
  const isStaff = staffRoles.includes(newRole);

  if (!wasStaff && isStaff && targetUser.restaurantId) {
    // User became staff - increment count
    try {
      const restaurantService = await import('../services/restaurantService.js');
      await restaurantService.incrementRestaurantStat(targetUser.restaurantId, 'totalStaff');
    } catch (error) {
      console.error('Error updating restaurant stats after role change:', error);
    }
  } else if (wasStaff && !isStaff && targetUser.restaurantId) {
    // User stopped being staff - decrement count
    try {
      const restaurantService = await import('../services/restaurantService.js');
      await restaurantService.decrementRestaurantStat(targetUser.restaurantId, 'totalStaff');
    } catch (error) {
      console.error('Error updating restaurant stats after role change:', error);
    }
  }
// end
  return {
    id: targetUser._id,
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    isActive: targetUser.isActive
  };
};

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_ACCESS_EXPIRE }
  );
};
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_REFRESH_EXPIRE }
  );
};
// //module.exports={registerUser,
//   loginUser,
//   logoutUser,
//   refreshAccessToken,
//   getAllUsers,
//   getUserById,
//   updateProfile,
//   updateUserRole
// }
