const jwt = require("jsonwebtoken");
const { ENV } = require("../config/env.js");
const User = require("../models/user.js");
const Staff = require("../models/staff.js");

// JWT token blacklist (in production, use Redis)
const tokenBlacklist = new Set();
exports.addToBlacklist = (token) => {
  tokenBlacklist.add(token);

}

exports.authenticationToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({
      message: "Unauthorized: Missing token ",
      success: false
    })
  }
}
exports.authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({
        message: "No token provided ",
        success: false
      })
    }
    const token = authHeader.split(' ')[1];

    // check balckList
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked"
      })
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
      //Ckeck staff is active
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
      }
    } else {


      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found"
        })
      }

      authenticatedUser = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        type: 'user',
        restaurantId: user.restaurantId?.toString()
      }
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
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
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


// export default authMiddleware;

// module.exports = authMiddleware;