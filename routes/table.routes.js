import express from "express";
import * as tableController from "../controllers/tableController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";



// const express = require('express')
// const tableController = require('../controllers/tableController.js')
// const {authMiddleware}= require('../middlewares/auth.js')
// const {requireRoles} = require('../middlewares/roles.js')
// const {generalLimiter} = require('../middlewares/rate-limit.js')

const router = express.Router();

router.use(authMiddleware);

router.get("/get/table",  tableController.getTables);
router.get("/get/table/by/:id",  tableController.getTableById);
router.post("/create/tables",  requireRoles('Owner', 'Admin', 'Manager','Cashier','Waiter'), tableController.createTable);
router.put("/update/table/by/:id", requireRoles('Owner', 'Admin', 'Manager','Cashier'), tableController.updateTable);
router.patch("/update/table/status/by/:id/status", requireRoles('Owner', 'Admin', 'Manager', 'Waiter','Cashier'), tableController.updateTableStatus);
router.patch("/transfer/table/:tableNumber", requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter'),tableController.transferTable)
router.patch("/complete/cleaning/:tableNumber", requireRoles('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter'),tableController.completeCleaning)
router.delete("/delete/table/by/:id", requireRoles('Owner', 'Admin', 'Manager','Cashier'), tableController.deleteTable);

export default router;
//module.exports= router
