import mongoose from "mongoose";

//const mongoose=require('mongoose')
const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  foodType: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Vegan', 'Egg'],
    default: 'Veg'
  },
  image: {
    type: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  ingredients: [{
    type: String
  }],
  allergens: [{
    type: String
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  
  restaurantId: {
    type : mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true // manue must belong to a restaurant
  }
}, {
  timestamps: true
});

menuItemSchema.index({ categoryId: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

export default mongoose.model("MenuItem", menuItemSchema);
//module.exports=mongoose.model('MenuItem,menuItemSchema')
