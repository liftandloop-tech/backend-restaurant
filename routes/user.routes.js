const express = require("express");
const userController = require("../controllers/userController.js");
const { authMiddleware } = require("../middlewares/auth.js");
const { requireRoles } = require("../middlewares/roles.js");
const {validate ,schemas} =require("../middlewares/validation.js");

const router = express.Router();

// Public routes
router.post("/user/register"
  , validate(schemas.register),
  userController.register);

router.post("/user/login"
  , validate(schemas.login),
  userController.login);

router.post("/refresh-token"
  , validate(schemas.refreshToken), userController.refreshToken);

router.post("/forgot-password", userController.forgotPassword);
router.put("/reset-password/:token", userController.resetPassword);

// Protected routes
router.post("/user/logout"
  , authMiddleware, userController.logout);

router.get("/user/get"
  , authMiddleware, requireRoles('Owner', 'Admin', 'Manager'), userController.getAllUsers);

router.get("/get/user/by/:id"
  , authMiddleware,
  requireRoles('Owner', 'Admin', 'Manager'), userController.getUserById);

// Profile routes - All authenticated users
router.get("/user/profile"
  , authMiddleware, userController.getProfile);
router.put("/user/profile",
  authMiddleware, userController.updateProfile);

// Update user role - Owner/Admin only
router.patch("/user/role",
  authMiddleware, requireRoles('Owner', 'Admin'),
  validate(schemas.updateUserRole), userController.updateUserRole
);

router.patch("/user/change-password",
  authMiddleware, validate(schemas.passwordChange), userController.changePassword
);

module.exports = router;
