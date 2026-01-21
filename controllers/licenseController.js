//all new
const { catchAsync } = require("../utils/errorHandler.js");
const { verifyLicenseKey } = require("../services/license.service.js");

exports.verifyLicense = catchAsync(async (req, res) => {
    const { licenseToken, licenseKey } = req.body;
    const restaurantId = req.user.restaurantId;

    if (!licenseToken || !licenseKey) {
        return res.status(400).json({
            success: false,
            message: "License request token and license key are required"
        });
    }

    const result = await verifyLicenseKey(licenseToken, licenseKey, restaurantId);

    // Update user with license token
    // We need to require User model first
    const User = require("../models/user.js");
    const user = await User.findById(req.user._id);
    user.licenseToken = licenseToken;
    await user.save();

    res.status(200).json({
        success: true,
        message: "License verified and activated successfully",
        data: result
    });
});

exports.getLicenseToken = catchAsync(async (req, res) => {
    // Since this is a protected route, we can access the user from req.user
    // We need to fetch the fresh user data to get the licenseToken
    const User = require("../models/user.js");
    const user = await User.findById(req.user.userId);

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // If user somehow doesn't have a token (old users), generate one and save it
    if (!user.licenseToken) {
        user.licenseToken = `REQ-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        await user.save();
    }

    res.status(200).json({
        success: true,
        licenseToken: user.licenseToken
    });
});

// Admin endpoint to generate a key for a token (Dev/Test only)
exports.generateLicenseKey = catchAsync(async (req, res) => {
    const { licenseToken } = req.body;
    if (!licenseToken) {
        return res.status(400).json({ success: false, message: "License Token is required" });
    }

    // We attach it to the current user's restaurant as a placeholder/owner
    const { generateKeyForToken } = require("../services/license.service.js");
    const licenseKey = await generateKeyForToken(licenseToken, null, req.user.restaurantId);

    res.status(200).json({
        success: true,
        licenseKey
    });
});