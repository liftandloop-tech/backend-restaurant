import express from "express";
import * as offerController from "../controllers/offerController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { requireRoles } from "../middlewares/roles.js";



// const express = require('express')
// const offerController = require('../controllers/offerController.js')
// const{authMiddleware} = require('../middlewares/auth.js')
// const {requireRoles} = require('../middlewares/roles.js')
// const {generalLimiter} = require('../middlewares/rate-limit.js')


const router = express.Router();

router.use(authMiddleware);

router.get("/get/offer", offerController.getOffers);
router.get("/get/offer/by/:id", offerController.getOfferById);
router.post("/create/offer", requireRoles('Owner', 'Admin', 'Manager'), offerController.createOffer);
router.put("/update/offer/by/:id", requireRoles('Owner', 'Admin', 'Manager'), offerController.updateOffer);
router.patch("/offer/status/by/:id/status", requireRoles('Owner', 'Admin', 'Manager'), offerController.updateOfferStatus);
router.delete("/delete/offer/by/:id", requireRoles('Owner', 'Admin', 'Manager'), offerController.deleteOffer);

export default router;
//module.exports= router
