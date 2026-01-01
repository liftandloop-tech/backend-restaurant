//total new
// Helper to resolve restaurantId
export const resolveRestaurantId = async (userId) => {
    // Dynamic imports to avoid potential circular dependency issues
    const User = (await import('../models/user.js')).default;
    const Staff = (await import('../models/staff.js')).default;
    const Restaurant = (await import('../models/restaurant.js')).default;

    let restaurantId = null;

    // 1. Try to find the User
    const user = await User.findById(userId);
    if (user) {
        if (user.restaurantId) {
            restaurantId = user.restaurantId;
        } else {
            // 2. If user has no direct restaurantId, check if they OWN a restaurant
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
        // 4. User not found in 'User' collection? Try 'Staff' collection directly.
        const staff = await Staff.findById(userId);
        if (staff && staff.restaurantId) {
            restaurantId = staff.restaurantId;
        }
    }

    if (!restaurantId && userId) {
        console.warn(`[resolveRestaurantId] Could not resolve restaurantId for userId: ${userId}`);
    }

    return restaurantId;
};
