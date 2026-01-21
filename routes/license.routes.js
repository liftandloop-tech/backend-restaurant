const express = require("express");
const { verifyLicense, getLicenseToken } = require("../controllers/licenseController.js");
const { authMiddleware } = require("../middlewares/auth.js");
const router = express.Router();

router.post('/verify', authMiddleware, verifyLicense);
router.post('/get-token', authMiddleware, getLicenseToken);
router.post('/generate-key', authMiddleware, require("../controllers/licenseController.js").generateLicenseKey);

module.exports = router;
//all new