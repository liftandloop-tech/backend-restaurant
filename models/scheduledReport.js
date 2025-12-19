import mongoose from "mongoose";

// const mongoose=require('mongoose')

const scheduledReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: false // reports must belong to a restaurant
  },
  reportType: {
    type: String,
    enum: ['all', 'customer', 'billing', 'order', 'inventory', 'staff'],
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    required: true
  },
  time: {
    type: String,
    required: true // Format: "HH:mm"
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv'],
    default: 'pdf'
  },
  includeCharts: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSent: {
    type: Date
  },
  nextRun: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
scheduledReportSchema.index({ userId: 1, isActive: 1 });
scheduledReportSchema.index({ nextRun: 1, isActive: 1 });

export default mongoose.model("ScheduledReport", scheduledReportSchema);
//module.exports=mongoose.model('ScheduleReport,sheduleReportSchema')
