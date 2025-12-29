import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import User from "../models/user.js";
import Staff from "../models/staff.js";
//import License from "../models/license.js";

// const License=require('../models/license.js')
// const User=require('../models/user.js')
// const{ENV}=require('../config/env.js')
// const jwt=require('jsonwebtoken')

// JWT token blacklist (in production, use Redis)
const tokenBlacklist = new Set();

export const addToBlacklist = (token) => {
  tokenBlacklist.add(token);
};

// export const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({
//       success: false,
//       message: "Unauthorized: Missing token",
//     });
//   }
// }
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing token"
    });
  }
}

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const token = authHeader.split(' ')[1];

    // Check blacklist
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked"
      });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    // Check if this is a staff token or user token
    let authenticatedUser = null;
    let userType = 'user';

    if (decoded.type === 'staff') {
      // This is a staff member
      userType = 'staff';
      const staff = await Staff.findById(decoded.id || decoded.userId);
      if (!staff) {
        return res.status(401).json({
          success: false,
          message: "Staff member not found"
        });
      }

      // Check if staff is active
      if (!staff.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated"
        });
      }

      authenticatedUser = {
        userId: staff._id.toString(),
        email: staff.email,
        role: staff.role,
        name: staff.fullName,
        type: 'staff',
        phoneNumber: staff.phoneNumber,
        username: staff.username,
        restaurantId: staff.restaurantId?.toString()
      };
    } else {
      // This is a regular user (owner/admin/manager)
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }

      authenticatedUser = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        type: 'user',
        restaurantId: user.restaurantId?.toString()
      };

      // License activation check for users - commented out since License is not imported
      // if (user.licenseId) {
      //   const license = await License.findOne(user.licenseId);
      //   const now = new Date();
      //
      //   if (!license || !license.isUsed || license.expiryDate <= now) {
      //     user.status = 'suspended';
      //     await user.save();
      //     return res.status(403).json({ success: false, message: 'User license is expired or invalid'});
      //   }
      // }
    }

    req.user = authenticatedUser;
    req.userType = userType;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    }
    return res.status(403).json({
      success: false,
      message: "Invalid token"
    });
  }
};

export default authMiddleware;
//module.exports=authMiddleware;
