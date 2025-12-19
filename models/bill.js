import mongoose from "mongoose";

// const  mongoose=require('mongoose')

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
  },
  // customerId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Customer',
  //   required: false, // Optional for walk-in customers
  //   index: true
  // },
  customerId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false, //optional for walk in customers
    index: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet'],
    default: null,
    index: true
  },
  paid: {
    type: Boolean,
    default: false,
    index: true
  },
  paidAt: {
    type: Date
  },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  idempotencyKey: {
    type: String,
    unique: true,
    default: null,
    sparse: true,
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: false //Will be sent when bill is created
  },
  refunded: {
    type: Boolean,
    default: false
  },
  refundedAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Generate bill number before saving
billSchema.pre('validate', async function(next) {
  if (!this.billNumber) {
    const count = await mongoose.model('Bill').countDocuments();
    this.billNumber = `BILL-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes
billSchema.index({ createdAt: -1 });
billSchema.index({ paymentMethod: 1, createdAt: -1 });
billSchema.index({ paid: 1, createdAt: -1 });
billSchema.index({ cashierId: 1, createdAt: -1 });

export default mongoose.model("Bill", billSchema);
//module.exports=mongoose.model('Bill,billSchama')