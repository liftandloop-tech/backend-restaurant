import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    // Schema to collect generated scheduled reports and manual snapshots
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Changed to User to match common auth patterns, or 'Staff' if strict
        required: false
    },
    reportType: {
        type: String,
        enum: ['all', 'order', 'billing', 'inventory', 'menu', 'staff', 'vendor', 'offer', 'purchase'],
        required: true
    },
    dateRange: {
        type: String,
        default: 'Custom'
    },
    period: {
        from: {
            type: Date,
            required: true
        },
        to: {
            type: Date,
            required: true
        }
    },
    metrics: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    charts: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // We might store the detailed data (rows) or just the summary. 
    // Storing huge arrays of orders might hit document size limits (16MB), 
    // but for a typical report snapshot it's usually fine.
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    },
    format: {
        type: String,
        enum: ['json', 'pdf', 'excel'],
        default: 'json'
    }
}, {
    timestamps: true
});

reportSchema.index({ restaurantId: 1, reportType: 1, createdAt: -1 });

export default mongoose.model("Report", reportSchema);
