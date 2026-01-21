const jwt = require("jsonwebtoken");
const { ENV } = require("../config/env.js");
const User = require("../models/user.js");
const { AppError } = require("../utils/errorHandler.js");
const { addToBlacklist } = require("../middlewares/auth.js");
const { ROLES } = require("../middlewares/roles.js");
const crypto = require("crypto");
const sendEmail = require("../utils/email.js");

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.eamil,
      role:user.role
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_ACCESS_EXPIRE }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_REFRESH_EXPIRE }
  );
};
exports.registerUser = async (userData) => {
  const { email, password, name, role } = userData;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  // Generate license token
  const licenseToken =`REQ-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  console.log("Generated License Token for new user:", licenseToken);

  // Create user
  const user = await User.create({
    email,
    password,
    name,
    role,
    licenseToken
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
      role: user.role,
      licenseToken: user.licenseToken // Return token
    },
    accessToken,
    refreshToken
  };
};

exports.loginUser = async (email, password) => {
  // Find user by email only (mobile is optional)
  const user = await User.findOne({ email }).select('+password +refreshToken +refreshTokenExpiry');

  if (!user || !await user.comparePassword(password)) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }
//new
  // Ensure license token exists for existing users
  if (!user.licenseToken) {
    user.licenseToken = `REQ-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    await user.save({ validateBeforeSave: false });
    console.log("Generated missing License Token for logging-in user:", user.licenseToken);
  }

  // Check if user has a restaurant or needs one created
  try {
    const restaurantService = require("./restaurantService.js");
    const restaurant = await restaurantService.ensureUserHasRestaurant(user._id);
    // If a restaurant was found or created, update the user object in memory
    if (restaurant) {
      user.restaurantId = restaurant._id;
    }
  } catch (error) {
    console.warn("Could not ensure restaurant for user:", error.message);
    // Continue login even if restaurant creation fails (e.g. for staff who don't need to own one)
  }
//end
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
      role: user.role,
      restaurantId: user.restaurantId,
      licenseToken: user.licenseToken // Return token
    },
    accessToken,
    refreshToken
  };

  console.log('Backend loginUser returning:', {
    hasUser: !!result.user,
    hasAccessToken: !!result.accessToken,
    hasRefreshToken: !!result.refreshToken,
    restaurantId: result.user.restaurantId
  });

  return result;
}

exports.refreshAccessToken = async (refreshToken) => {
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

exports.logoutUser = async (userId, token) => {
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

exports.getAllUsers = async (filters = {}) => {
  const query = {};
  if (filters.role) query.role = filters.role;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;

  return await User.find(query).select('-password -refreshToken').sort({ createdAt: -1 });
};

exports.getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken').lean();
  if (!user) {
    throw new AppError("User not found", 404);
  }
  //new
  // Ensure restaurantId is included
  if (!user.restaurantId) {
    try {
      const Restaurant = require("../models/restaurant.js");
      const restaurant = await Restaurant.findByOwner(user._id);
      if (restaurant) {
        user.restaurantId = restaurant._id;
      } else {
        // Fallback: Check if this user ID exists in Staff collection (rare edge case of mixed auth)
        const Staff = require("../models/staff.js");
        const staff = await Staff.findById(userId);
        if (staff && staff.restaurantId) {
          user.restaurantId = staff.restaurantId;
        }
      }
    } catch (err) {
      console.warn("Error resolving restaurantId in getUserById:", err);
    }
  }

  return user;
};
//end
exports.updateProfile = async (userId, updateData) => {
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

exports.updateUserRole = async (targetUserId, newRole, actingUser) => {
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
      const restaurantService = require("../services/restaurantService.js");
      await restaurantService.incrementRestaurantStat(targetUser.restaurantId, 'totalStaff');
    } catch (error) {
      console.error('Error updating restaurant stats after role change:', error);
    }
  } else if (wasStaff && !isStaff && targetUser.restaurantId) {
    // User stopped being staff - decrement count
    try {
      const restaurantService = require("../services/restaurantService.js");
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

exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
//new
exports.changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new AppError("Incorrect current password", 400);
  }

  user.password = newPassword;
  await user.save();

  return { message: "Password changed successfully" };
};

exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('There is no user with that email address.', 404);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash it and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });

    return { message: 'Email sent' };
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Email could not be sent', 500);
  }
};

exports.resetPassword = async (token, newPassword) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid token', 400);
  }

  // Set new password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return { message: 'Password reset successful' };
};
//end
exports.generateAccessToken = (user) => {
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
exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_REFRESH_EXPIRE }
  );
};
// //export default {registerUser,
//   loginUser,
//   logoutUser,
//   refreshAccessToken,
//   getAllUsers,
//   getUserById,
//   updateProfile,
//   updateUserRole
// }
