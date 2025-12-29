import express from "express";
import * as customerController from "../controllers/customerController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";


// const express = require('express')
// const customerController = require('../controllers/customerController.js')
// const{authMiddleware} = require('../middlewares/auth.js')
// const {requireRoles} = require('../middlewares/roles.js')
// const {generalLimiter} = require('../middlewares/rate-limit.js')


const router = express.Router();

router.use(authMiddleware);

router.get("/get/customer", customerController.getCustomers);
router.get("/get/customer/by/id", customerController.getCustomerById);
router.post("/create/customer", requireRoles('Owner', 'Admin', 'Manager', 'Waiter', 'Cashier'), customerController.createCustomer);
router.put("/update/customer/by/id", requireRoles('Owner', 'Admin', 'Manager', 'Cashier'), customerController.updateCustomer);
router.delete("/delete/customer/by/id", requireRoles('Owner', 'Admin', 'Manager', 'Cashier'), customerController.deleteCustomer);

export default router;

//module.exports=router