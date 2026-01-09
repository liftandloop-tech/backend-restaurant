//total new
import License from "../models/license.js";
import Restaurant from "../models/restaurant.js";
import { AppError } from "../utils/errorHandler.js";

export const verifyLicenseKey = async (licenseKey, restaurantId) => {
    // 1. Find the license
    const license = await License.findOne({ licenseKey });

    if (!license) {
        throw new AppError("Invalid license key", 400);
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
        expiryDate: license.expiryDate,
        status: "active"
    };
};
