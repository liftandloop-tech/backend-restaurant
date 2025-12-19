import express from "express";
import * as inventoryController from "../controllers/inventoryController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";
import {validate,schemas} from "../middlewares/validation.js"


// const express = require('express')
// const inventoryController = require('../controllers/inventoryController.js')
// const{authMiddleware} = require('../middlewares/auth.js')
// const {requireRoles} = require('../middlewares/roles.js')
// const {generalLimiter} = require('../middlewares/rate-limit.js')
// const {validate,schemas}=require('../middlewares/validation.js')


const router = express.Router();

router.use(authMiddleware);

router.get("/get/item", inventoryController.getInventoryItems);
router.get("/get/item/by/id", inventoryController.getInventoryItemById);
router.post("/create/item",  requireRoles('Owner','Admin','Manager','Cashier'),validate(schemas.inventoryItem),inventoryController.createInventoryItem)
router.put("/update/item/by/:id", requireRoles('Owner', 'Admin', 'Manager'), inventoryController.updateInventoryItem);
router.delete("/delete/item/by/:id",requireRoles('Owner', 'Admin', 'Manager'), inventoryController.deleteInventoryItem);
router.get("/get/low-stock/items", inventoryController.getLowStockItems);

 export default router;
//module.exports=router
