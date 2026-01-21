// all new for w
const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  // Basic Restaurant Information
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Contact Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 15
  },
  website: {
    type: String,
    trim: true
  },

  // Address Information
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'India'
    }
  },

  // License Information
  licenseKey: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  licenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'license'
  },
  licenseActivated: {
    type: Boolean,
    default: false
  },
  licenseExpiryDate: {
    type: Date
  },

  // Financial Information
  accountBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyRevenue: {
    type: Number,
    default: 0,
    min: 0
  },

  // Business Hours
  businessHours: {
    monday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    tuesday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    wednesday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    thursday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    friday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    saturday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: true }
    },
    sunday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
      isOpen: { type: Boolean, default: false }
    }
  },

  // Settings & Preferences
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  taxRate: {
    type: Number,
    default: 18, // GST rate
    min: 0,
    max: 100
  },

  // Operational Settings
  maxTables: {
    type: Number,
    default: 50,
    min: 1
  },
  maxStaff: {
    type: Number,
    default: 100,
    min: 1
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Statistics
  totalOrders: {
    type: Number,
    default: 0
  },
  totalCustomers: {
    type: Number,
    default: 0
  },

  totalStaff: {
    type: Number,
    default: 0
  },
  totalTables: {
    type: Number,
    default: 0
  },
  totalInventoryItems: {
    type: Number,
    default: 0
  },
  totalReservations: {
    type: Number,
    default: 0
  },
  totalReports: {
    type: Number,
    default: 0
  },
  totalMenuItems: {
    type: Number,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },

  // Relationships (will be populated by services)
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance

restaurantSchema.index({ isActive: 1 });
restaurantSchema.index({ ownerId: 1 });

// Virtual for formatted address
restaurantSchema.virtual('formattedAddress').get(function () {
  const addr = this.address;
  if (!addr) return '';
  return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}, ${addr.country || ''}`.replace(/^, |, $/, '');
});

// Virtual for business status
restaurantSchema.virtual('isOpen').get(function () {
  const now = new Date();
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const todayHours = this.businessHours[dayOfWeek];

  if (!todayHours || !todayHours.isOpen) return false;

  const currentTime = now.getHours() * 100 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  const openTime = openHour * 100 + openMin;
  const closeTime = closeHour * 100 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
});

// Pre-save middleware
restaurantSchema.pre('save', function (next) {
  if (this.isModified('totalOrders') && this.totalOrders > 0) {
    this.averageOrderValue = this.totalRevenue / this.totalOrders;
  }
  next();
});

// Static method to find restaurant by owner
restaurantSchema.statics.findByOwner = function (ownerId) {
  return this.findOne({ ownerId, isActive: true });
};

// Static method to find restaurant by license
restaurantSchema.statics.findByLicense = function (licenseKey) {
  return this.findOne({ licenseKey, isActive: true });
};
module.exports = mongoose.model("Restaurant", restaurantSchema);
