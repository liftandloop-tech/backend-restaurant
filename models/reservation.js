import mongoose from "mongoose";

// const mongoose= require('mongoose')
const reservationSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  tableNumber: {
    type: Number,
    required: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  },
  reservationDate: {
    type: Date,
    required: true,
    index: true
  },
  reservationTime: {
    type: String,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
    index: true
  },
  specialRequests: {
    type: String,
    maxlength: 500
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    maxlength: 200
  },  
  restaurantId: {
    type : mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true // reservation must belong to a restaurant
  }
}, {
  timestamps: true
});

reservationSchema.index({ reservationDate: 1, status: 1 });
reservationSchema.index({ customerPhone: 1 });

export default mongoose.model("Reservation", reservationSchema);
//module.exports=mongoose.model('Reservation',reservationSchema)
