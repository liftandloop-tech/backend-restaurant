const mongoose =require("mongoose");

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
    min: 1
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['available', "serving", "reserved", "cleaning", "maintenance", "transfer"],
    default: 'available',
    index: true
  },
  location: {
    type: String,
    enum: ['indoor', 'outdoor', 'vip', 'bar'],
    default: 'indoor'
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  reservedUntil: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },

  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true // Tables must belong to a restaurant
  }
}, {
  timestamps: true
});

tableSchema.index({ status: 1 });
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
module.exports= mongoose.model("Table", tableSchema);
