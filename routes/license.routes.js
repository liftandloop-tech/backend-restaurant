import express from 'express';
import { verifyLicense } from "../controllers/licenseController.js";
import { authMiddleware } from "../middlewares/auth.js";

 const router = express.Router();

 router.post('verify', authMiddleware, verifyLicense)

 export default router;