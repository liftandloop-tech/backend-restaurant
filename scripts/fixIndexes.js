const mongoose =require("mongoose");
const { connectDB       } =require ("../config/db.js");

const fixIndexes = async () => {
    console.log("Starting index fix script...");
    await connectDB();

    console.log("Connected to DB. Fixing indexes...");

    try {
        const db = mongoose.connection.db;

        // Tables
        console.log("Checking tables collection...");
        const tables = db.collection('tables');
        try {
            // Try to drop the unique index on tableNumber
            // The name might be "tableNumber_1" or generic.
            await tables.dropIndex('tableNumber_1');
            console.log("✅ Dropped tableNumber_1 index from tables");
        } catch (e) {
            console.log("ℹ️ tableNumber_1 index issue:", e.message);
        }

        // Inventory
        console.log("Checking inventoryitems collection...");
        const inventory = db.collection('inventoryitems');
        try {
            await inventory.dropIndex('name_1');
            console.log("✅ Dropped name_1 index from inventoryitems");
        } catch (e) {
            console.log("ℹ️ name_1 index issue in inventoryitems:", e.message);
        }

    } catch (error) {
        console.error("❌ Error fixing indexes:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Done.");
        process.exit(0);
    }
};

fixIndexes();
