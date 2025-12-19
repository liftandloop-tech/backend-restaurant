import express from "express";
import * as menuController from "../controllers/menuController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";



// const express = require('express')
// const menuController = require('../controllers/menuController.js')
// const{authMiddleware} = require('../middlewares/auth.js')
// const {requireRoles} = require('../middlewares/roles.js')
// const {generalLimiter} = require('../middlewares/rate-limit.js')


const router = express.Router();

router.use(authMiddleware);

// Category routes
router.get("/categories", menuController.getCategories);
router.post("/categories",requireRoles('Owner', 'Admin', 'Manager'), menuController.createCategory);
router.put("/categories/:id", requireRoles('Owner', 'Admin', 'Manager'), menuController.updateCategory);
router.delete("/categories/:id", requireRoles('Owner', 'Admin', 'Manager'), menuController.deleteCategory);

// Menu item routes
router.get("/items", menuController.getMenuItems);
router.get("/items/:id", menuController.getMenuItemById);
router.post("/items", requireRoles('Owner', 'Admin', 'Manager'), menuController.createMenuItem);
router.put("/items/:id", requireRoles('Owner', 'Admin', 'Manager'), menuController.updateMenuItem);
router.delete("/items/:id", requireRoles('Owner', 'Admin', 'Manager'), menuController.deleteMenuItem);

export default router;
//module.exports= router
