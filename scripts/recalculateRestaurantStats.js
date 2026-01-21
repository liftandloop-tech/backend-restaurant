const mongoose =require ("mongoose");
const Restaurant =require("../models/restaurant.js");
const { recalculateRestaurantStats       } =require("../services/restaurantService.js");

/**
 * Script to recalculate statistics for all restaurants
 * This ensures all restaurant statistics are accurate
 */
async function recalculateAllRestaurantStats() {
  try {
    console.log('Starting recalculation of statistics for all restaurants...');

    // Find all active restaurants
    const restaurants = await Restaurant.find({ isActive: true });

    if (restaurants.length === 0) {
      console.log('No active restaurants found.');
      return;
    }

    console.log(`Found ${restaurants.length} active restaurants. Recalculating statistics...`);

    // Process each restaurant
    for (const restaurant of restaurants) {
      try {
        console.log(`Processing restaurant: ${restaurant.name} (${restaurant._id})`);
        await recalculateRestaurantStats(restaurant._id);
        console.log(`✓ Completed restaurant: ${restaurant.name}`);
      } catch (error) {
        console.error(`✗ Failed to recalculate stats for restaurant ${restaurant.name} (${restaurant._id}):`, error.message);
      }
    }

    console.log('Recalculation completed for all restaurants!');

  } catch (error) {
    console.error('Script failed:', error);
    throw error;
  }
}

// Run the script if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose.connect('mongodb://localhost:27017/restaurant-db')
    .then(() => {
      console.log('Connected to database');
      return recalculateAllRestaurantStats();
    })
    .then(() => {
      console.log('Statistics recalculation script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Statistics recalculation script failed:', error);
      process.exit(1);
    });
}

module.exports = recalculateAllRestaurantStats;
