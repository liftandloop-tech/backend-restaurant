
// import * as userService from "../services/userService.js";
// import { sendSuccess   } from "../utils/response.js";
// import { AppError   } from "../utils/errorHandler.js";
const { AppError } = require('../utils/errorHandler.js')
const { sendSuccess, sendError } = require('../utils/response.js')
const userService = require("../services/userService.js");


exports.register = async (req, res, next) => {
  try {
    const result = await userService.registerUser(req.validated)
    sendSuccess(res, "user registered successfully", result, 201);
  } catch (error) {
    next(error)
  }
}


exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.validated;
    const result = await userService.loginUser(email, password, req.validated.mobile);
    sendSuccess(res, "login successfully", result);
  } catch (error) {
    next(error)
  }
}


exports.refreshToken = async (req, res, next) => {
  try {
    if (!req.body || !req.body.refreshToken) {
      throw new AppError("Refresh token is required")
    }
    const { refreshToken } = req.body;
    const result = await userService.refreshAccessToken(refreshToken);
    sendSuccess(res, "Token refreshed successfully", result);
  } catch (error) {
    next(error)
  }
}

exports.logout = async (req, res, next) => {
  try {

    const token = req.headers.authorization?.split(' ')[1];
    await userService.logoutUser(req.user.userId, token);
    sendSuccess(res, "logged out  successfully", token);
  } catch (error) {
    next(error)
  }
}

exports.getAllUsers = async (req, res, next) => {
  try {

    const users = await userService.getAllUsers(req.query);
    sendSuccess(res, "User retrieved  successfully", users);
  } catch (error) {
    next(error)
  }
}


exports.getUserById = async (req, res, next) => {
  try {

    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, "User retrieved  successfully", user);
  } catch (error) {
    next(error)
  }
}

exports.updateProfile = async (req, res, next) => {
  try {

    const user = await userService.updateProfile(req.user.userId, req.body);
    sendSuccess(res, "Profile updated  successfully", user);
  } catch (error) {
    next(error)
  }
}


exports.getProfile = async (req, res, next) => {
  try {

    const user = await userService.getUserById(req.user.userId);
    sendSuccess(res, "Profile  retrieved  successfully", user);
  } catch (error) {
    next(error)
  }
}

exports.updateUserRole = async (req, res, next) => {
  try {
    const { userId, role } = req.validated;
    const updatedUser = await userService.updateUserRole(userId, role, req.user);
    sendSuccess(res, "User role updated successfully", updatedUser);
  } catch (error) {
    next(error)
  }
}


exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.validated;
    const result = await userService.changePassword(req.user.userId, oldPassword, newPassword);
    sendSuccess(res, "Password changed successfully", result);
  } catch (error) {
    next(error)
  }
}


exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError("Email is required", 400);
    }
    const result = await userService.forgotPassword(email);
    sendSuccess(res, "Email sent", result);
  } catch (error) {
    next(error)
  }
}

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body
    if (!password) {
      throw new AppError("New password is required", 400);
    }
    const result = await userService.resetPassword(token, password);
    sendSuccess(res, "Password reset successfully", result);
  } catch (error) {
    next(error)
  }
}
// end
// export default {
// register,
// login,
// logout,
// refreshToken,
// getAllUsers,
// getUserById,
// updateProfile,
// getProfile,
// updateUserRole}
