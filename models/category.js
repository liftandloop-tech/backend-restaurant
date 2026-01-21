const mongoose= require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  image: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },

  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true // category must belong to a restaurant
  }
}, {
  timestamps: true
});

categorySchema.index({ isActive: 1, displayOrder: 1 });
categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

// export default mongoose.model("Category", categorySchema);
module.exports = mongoose.model("Category", categorySchema);