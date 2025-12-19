// import express from "express";
// import * as licenseController from "../controllers/licenseController.js";
// import {authMiddleware} from "../middlewares/auth.js";
// import {requireRoles} from "../middlewares/roles.js";
// import {generalLimiter} from "../middlewares/rate-limit.js";


// const router =express.Router();

// // All routes require authentication

// router.use(authMiddleware)

// //Generate license for current user

// router.post("/generate",generalLimiter,licenseController.generateLicense);


// // Current user's license
// router.get("/my-license",generalLimiter,licenseController.getMyLicense);

// //Validate license key
// router.post("/validate",generalLimiter,licenseController.validateLicense)

// //Get all license (Admin/owner and Cashier only)
// router.get("/all",generalLimiter,requireRoles('Owner', 'Admin','Cashier'),licenseController.getAllLicenses);
// export default router;