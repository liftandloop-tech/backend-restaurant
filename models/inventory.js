import mongoose from "mongoose";
//const mongoose=require('mongoose')
const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['vegetable', 'fruit', 'meat', 'dairy', 'beverage', 'spice', 'grain', 'dryfood', 'other'],
    default: 'other'
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'piece', 'pack', 'box'],
    required: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 0,
    min: 0
  },
  maxStockLevel: {
    type: Number,
    min: 0
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  vendor: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: false //Will be sent when invantory items  is created
  }
}, {
  timestamps: true
});

inventoryItemSchema.index({ name: 'text' });
inventoryItemSchema.index({ currentStock: 1, minStockLevel: 1 });
inventoryItemSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export default mongoose.model("InventoryItem", inventoryItemSchema);
//module.exports=mongoose.model('InventoryItme,inventorySchama')
