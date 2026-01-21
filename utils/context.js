//total new
// Helper to resolve restaurantId
exports.resolveRestaurantId = async (userId, req = null) => {
    // Dynamic imports to avoid potential circular dependency issues
    const { default: User } = await import("../models/user.js");
    const { default: Staff } = await import("../models/staff.js");
    const { default: Restaurant } = await import("../models/restaurant.js");


    // 0. Check explicit context from request (if provided)
    if (req) {
        //    Check headers first (most secure/standard way for frontend to pass context)
        if (req.headers && req.headers["x-restaurant-id"]) {
            return req.headers["x-restaurant-id"];
        }
        //Check body/query (usefull for initial setup or debugging)
        if (req.headers && req.body.restaurantId) {
            return req.body.restaurantId;
        }
        if (req.headers && req.query.restaurantId) {
            return req.query.restaurantId;
        }
    }
    let restaurantId = null;

    // Try to find the user
    const user = await User.findById(userId);
    if (user) {
        if (user.restaurantId) {
            restaurantId = user.restaurantId;

        } else {

            // 2.If user has no direct  restaurantId ,check if they own a restaurant
            const restaurant = await Restaurant.findByOwner(user._id);
            if (restaurant) {
                restaurantId = restaurant._id;

            } else {
                // 3. Last resort: check if this userID actually exists in the STAFF collection
                // (This happens if req.user.userId is from a Staff JWT but we looked up User model first)

                const staff = await Staff.findById(userId);
                if (staff && staff.restaurantId) {
                    restaurantId = staff.restaurantId;
                }
            }
        }
    } else {

        // 4. User not found in 'User' collrction? try 'Staff' collection directly.
        const staff = await Staff.findById(userId);
        if (staff && staff.restaurantId) {
            restaurantId = staff.restaurantId;
        }
    }

    if (!restaurantId && userId) {
        console.warn(`[resolveRestaurantId] Could not resolve redstaurantId for this userId: ${userId}`);
    }
    return restaurantId;
}