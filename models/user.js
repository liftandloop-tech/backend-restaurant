import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ENV } from "../config/env.js";

// const mongoose = require('mongoose')
// const bcrypt = require('bcryptjs');
// const{ENV}= require('../config/env.js');



const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  mobile: {
    type: String,        // you can use Number too, but String is safer (for +91 )
    //required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['Owner', 'Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen', 'Bar', 'Delivery'],
    default: 'Waiter',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: false //Not required for restaurant creattion,but will be sent after restaurant is created
  },

  licenseKey: {
    type: String,
    default: null,
    trim: true
  },

  refreshToken: {
    type: String,
    select: false
  },
  refreshTokenExpiry: {
    type: Date,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(ENV.BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
// Note: email index is automatically created by unique: true, so we don't need to explicitly add it
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

export default mongoose.model("User", userSchema);
//module.exports= mongoose.model('User',userSchema)