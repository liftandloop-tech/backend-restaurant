//total new
const mongoose = require("mongoose")

const licenseSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },

    licenseKey: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    requestToken: {
        type: String,
        required: false, // Optional as old licenses might not have it
        index: true
    },

    expiryDate: {
        type: Date,
        required: true
    },

    isUsed: {
        type: Boolean,
        default: false,
    },

    activatedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
})

// Index for performance (LicenseKey already indexed via unique: true)
licenseSchema.index({ restaurantId: 1 });
licenseSchema.index({ expiryDate: 1 });
licenseSchema.index({ isUsed: 1 });
licenseSchema.index({ createdAt: 1 });
licenseSchema.index({ restaurantId: 1, isUsed: 1 });

module.exports = mongoose.model("license", licenseSchema);

