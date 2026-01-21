//total new
const License = require("../models/license.js");
const Restaurant = require("../models/restaurant.js");
const { AppError } = require("../utils/errorHandler.js");

exports.verifyLicenseKey = async (licenseToken, licenseKey, restaurantId) => {
    // 1. Find the license
    const license = await License.findOne({ licenseKey });

    if (!license) {
        throw new AppError("Invalid license key", 400);
    }

    // 1.5 Check if license matches the request token (if stored)
    if (license.requestToken && license.requestToken !== licenseToken) {
        throw new AppError("This license key does not match your request token", 400);
    }

    // If license doesn't have a token yet but matches, we bind them? 
    // Or we assume the admin generated it correctly.
    // Let's bind them just in case.
    if (!license.requestToken) {
        license.requestToken = licenseToken;
    }

    // 2. Check if license belongs to another restaurant
    if (license.restaurantId && license.restaurantId.toString() !== restaurantId.toString()) {
        throw new AppError("This license key is already linked to another restaurant", 400);
    }

    // 3. Check expiry
    if (new Date(license.expiryDate) < new Date()) {
        throw new AppError("This license key has expired", 400);
    }

    // 4. Activate/Update
    // Update License
    license.isUsed = true;
    license.restaurantId = restaurantId;
    if (!license.activatedAt) {
        license.activatedAt = new Date();
    }
    await license.save();

    // Update Restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        throw new AppError("Restaurant not found", 404);
    }

    restaurant.licenseId = license._id;
    restaurant.licenseKey = licenseKey;
    restaurant.licenseActivated = true;
    restaurant.licenseExpiryDate = license.expiryDate;
    restaurant.isActive = true;

    await restaurant.save();

    return {
        licenseKey: license.licenseKey,
        licenseToken: licenseToken,
        expiryDate: license.expiryDate,
        status: "active"
    };
};

// Admin helper to generate a key for a token (Simulated Admin Function)
exports.generateKeyForToken = async (licenseToken, expiryDate, restaurantId) => {
    // Check if key already exists for this token
    let license = await License.findOne({ requestToken: licenseToken });
    if (license) return license.licenseKey;

    // Generate a formatted key: LIC-YYYY-XXXX-XXXX
    const randomPart = Math.random().toString(36).substr(2, 9).toUpperCase();
    const licenseKey = `LIC-${new Date().getFullYear()}-${randomPart.slice(0, 4)}-${randomPart.slice(4)}`;

    license = await License.create({
        licenseKey,
        requestToken: licenseToken,
        restaurantId: restaurantId, // Initially linked to the restaurant requesting it, or null
        expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
        isUsed: false
    });

    return license.licenseKey;
};
