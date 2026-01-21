const { mongoose } = require("mongoose");


const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  offerType: {
    type: String,
    enum: ['percentage', 'fixed', 'buy-one-get-one', 'free-item'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    min: 0
  },
  validFrom: {
    type: Date,
    required: true,
    index: true
  },
  validUntil: {
    type: Date,
    required: true,
    index: true
  },
  applicableItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  usageLimit: {
    type: Number, // Total times offer can be used
    min: 0
  },
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  image: {
    type: String
  },

  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true // offer must belong to a restaurant
  }
}, {
  timestamps: true
});

offerSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

module.exports = mongoose.model("Offer", offerSchema);
