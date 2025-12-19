 import mongoose from "mongoose";

//const mongoose=require('require')

const kotSchema = new mongoose.Schema({
  kotNumber: {
    type: String,
    unique: true,
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
  },
  station: {
    type: String,
    enum: ['kitchen', 'bar', 'beverage'],
    required: true,
    index: true
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    qty: {
      type: Number,
      required: true,
      min: 1
    },
    specialInstructions: {
      type: String,
      maxlength: 200
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'sent'],
    default: 'pending',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  
    isPrinted:{
      type: Boolean,
      default: false
    },
  
  printedAt: {
    type: Date
  },
  printedBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  restaurantId: {
    type : mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true // kots must belong to a restaurant
  }
}, {
  timestamps: true
});

// Generate KOT number before saving (fallback - should be set in service)
// This is kept as a fallback for cases where kotNumber might not be set
kotSchema.pre('save', async function(next) {
  if (!this.kotNumber && this.station) {
    const count = await mongoose.model('KOT').countDocuments();
    const stationCode = this.station.substring(0, 3).toUpperCase();
    this.kotNumber = `KOT-${stationCode}-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes
kotSchema.index({ orderId: 1, station: 1 });
kotSchema.index({ status: 1, station: 1 });
kotSchema.index({ createdAt: -1 });

export default mongoose.model("KOT", kotSchema);
//module.exports=mongoose.model('KOT,kotSchema')