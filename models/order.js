import mongoose from "mongoose";


// const mongoose=require('mongoose')
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  tableNumber: {
    type: Number,
    required: false,
    min: 1,
    validate: {
      validator: function(value){
        //if sourec is dien in or takeaway, table number is required
        if(this.source === 'dine-in' || this.source === 'takeaway'){
            return value !== null && value  && value >= 1;
        }
        //phone and online orders can have null table number
        return true;
      },
      message: 'Table number is required for dine-in and takeAway orders'
    }
  },
  source: {
    type: String,
    enum: ['dine-in', 'takeaway', 'online', 'phone'],
    default: 'dine-in',
    index: true,
  },
    items:[{
      menuItemId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'MenuItem'
      },
    
    name: {
      type: String,
      required: true,
      trim: true
    },
    qty: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    specialInstructions: {
      type: String,
      maxlength: 200
    }
  }],
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
  status: {
    type: String,
    enum: ['draft','pending', 'confirmed', 'preparing', 'ready', 'served', 'completed','cancelled'],
    default: 'pending',
    index: true
  },
  waiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },

     cashierId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: false // set when cashier confirms order
  },

  customerId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false // Optional for walk-in customers
  },

  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true // Required for proper restaurant isolation
  },
  customerName: {     // new for w
    type: String,
    trim: true,
    maxlength: 100,
    required: false // Will be validated in service layer
  },
  customerPhone: {
    type: String,
    trim: true,
    maxlength: 15,
    required: false // Will be validated in service layer
  },
  customerEmail: {
    type: String,
    trim: true,
    maxlength: 100,
    required: false // For online orders
  },
  deliveryAddress: {
    type: String,
    trim: true,
    maxlength: 500,
    required: false // For phone/online orders
  },
  deliveryPhone: {
    type: String,
    trim: true,
    maxlength: 15,
    required: false // For phone/online orders
  },
  deliveryTime: {
    type: String,
    trim: true,
    maxlength: 50,
    required: false // For phone/online orders
  },            // end
  notes: {
    type: String,
    maxlength: 500
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  cancellationReason: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes for performance
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ tableNumber: 1, status: 1 });
orderSchema.index({ waiterId: 1, createdAt: -1 });
orderSchema.index({ source: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
//module.exports=mongoose.model('Order,orderSchama')