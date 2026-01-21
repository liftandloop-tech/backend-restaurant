const mongoose = require("mongoose");

const wastageSchema = new mongoose.Schema({
    inventoryItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0.01
    },
    reason: {
        type: String,
        enum: ['expired', 'damaged', 'spoiled', 'spilled', 'other'],
        required: true
    },
    notes: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    }
}, {
    timestamps: true
});
module.exports = mongoose.model("Wastage", wastageSchema);
//new