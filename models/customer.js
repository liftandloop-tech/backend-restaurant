import mongoose from "mongoose";

// const mongoose=require('mongoose')

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  dateOfBirth: {
    type: Date
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  lastVisit: {
    type: Date
  },
  preferences: {
    dietaryRestrictions: [String],
    favoriteItems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }],
    allergies: [String]
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 1000
  },

  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true // customers must belong to a restaurant
  }
}, {
  timestamps: true
});

customerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true });
customerSchema.index({ email: 1 });
customerSchema.index({ name: 'text' });

export default mongoose.model("Customer", customerSchema);
//module.exports=mongoose.model('Customer,customerSchema')
