const Joi = require("joi");

//  import { Schema       } from "mongoose";
// import { updateUserRole       } from "../services/userService.js";

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    req.validated = value;
    next();
  };
};

// //new validtore function

// Common validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      .required(),
    role: Joi.string().valid('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen').default('Admin')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),


  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),

  scheduledReport: Joi.object({
    reportType: Joi.string().valid('all', 'customer', 'billing', 'order', 'inventory', 'staff').required(),
    frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly').required(),
    time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    email: Joi.string().email().required(),
    format: Joi.string().valid('pdf', 'excel', 'csv').default('pdf'),
    includeCharts: Joi.boolean().default(true)
  }),

  order: Joi.object({

    tableNumber: Joi.number().integer().min(1).when('source', {
      is: Joi.valid('dine-in', ' takeaway'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    items: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        qty: Joi.number().integer().min(1).required(),
        price: Joi.number().positive().required(),
        specialInstructions: Joi.string().max(200).optional()
      })
    ).min(1).required(),
    notes: Joi.string().max(500).optional(),
    source: Joi.string().valid('dine-in', 'takeaway', 'online', 'phone').default('dine-in'),

    waiterId: Joi.string().hex().length(24).optional(),
    customerId: Joi.string().hex().length(24).optional(),
    customerName: Joi.string().max(100).optional(),
    customerPhone: Joi.string().max(15).optional(),
    customerEmail: Joi.string().email().optional(),
    deliveryAddress: Joi.string().max(500).optional(),
    deliveryPhone: Joi.string().max(15).optional(),
    deliveryTime: Joi.string().max(50).optional(),

    discount: Joi.object({
      type: Joi.string().valid('percentage', 'flat').required(),
      value: Joi.number().positive().required(),
      reason: Joi.string().max(200).optional()
    }).optional(),
  }).optional(),
  updateOrder: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled').optional(),
    items: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        qty: Joi.number().integer().min(1).required(),
        price: Joi.number().positive().required(),
        specialInstructions: Joi.string().max(200).optional()
      })
    ).optional(),
    tableNumber: Joi.number().integer().min(1).optional(),
    subtotal: Joi.number().min(0).optional(),
    tax: Joi.number().min(0).optional(),
    total: Joi.number().min(0).optional(),
    notes: Joi.string().max(500).optional(),
    source: Joi.string().valid('dine-in', 'takeaway', 'online', 'phone').optional()
  }),

  bill: Joi.object({
    paymentMethod: Joi.string().valid('cash', 'card', 'upi', 'wallet').required(),
    transactionId: Joi.string().max(100).optional().allow(null, ''),
    gatewayResponse: Joi.object().optional(),
    idempotencyKey: Joi.string().uuid().required()
  }),

  inventoryItem: Joi.object({
    name: Joi.string().required().trim().max(100),
    category: Joi.string().optional(),
    unit: Joi.string().valid('kg', 'g', 'l', 'ml', 'piece', 'pack', 'box').required(),
    currentStock: Joi.number().min(0).optional(),
    minStockLevel: Joi.number().min(0).optional(),
    maxStockLevel: Joi.number().min(0).optional(),
    pricePerUnit: Joi.number().positive().required(),
    vendor: Joi.string().trim().max(100).optional(),
    expiryDate: Joi.date().optional(),
    batchNumber: Joi.string().trim().max(100).optional(),
    location: Joi.string().trim().max(100).optional(),
    notes: Joi.string().max(500).optional(),


  }),


  kot: Joi.object({
    orderId: Joi.string().hex().length(24).required(),
    station: Joi.string().valid('kitchen', 'bar', 'beverage').required()
  }),


  updateUserRole: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    role: Joi.string().valid('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen').required()
  }),

  reservation: Joi.object({
    customerName: Joi.string().min(2).required().trim().max(50),
    customerPhone: Joi.string().required().trim(),
    customerEmail: Joi.string().email().allow('').optional(),
    customerNumber: Joi.number().integer().min(1).required(),
    reservationDate: Joi.date().required(),
    reservationTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    numberOfGuests: Joi.number().integer().min(1).required(),
    specialRequests: Joi.string().max(500).optional().allow(''),

  }),


  staffRegistration: Joi.object({
    fullName: Joi.string().min(2).required().max(50),
    email: Joi.string().email().optional().allow('', null),
    phoneNumber: Joi.string().min(10).max(15).required(),
    username: Joi.string().min(3).max(30).required(),
    role: Joi.string().valid('Owner', 'Admin', 'Manager', 'Cashier', 'Waiter', 'Delivery', 'Kitchen', 'Bar').required(),


    profilePicture: Joi.string().optional().allow('', null),
    dateOfJoining: Joi.date().optional(),
    gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
    branch: Joi.string().optional(),
    supervisor: Joi.string().required(),
    shiftStart: Joi.string().optional(),
    shiftEnd: Joi.string().optional(),
    autoAddToAttendance: Joi.boolean().optional(),
    baseSalary: Joi.number().min(0).required(),
    paymentMode: Joi.string().optional(),
    tipCommissionEligible: Joi.boolean().optional(),
    bankName: Joi.string().optional(),

    ifscCode: Joi.string().optional(),
    accountNumber: Joi.string().optional(),
    internalNotes: Joi.string().optional(),
    restaurantId: Joi.string().optional(),
    createdBy: Joi.string().optional(),
  }),
  //
  staffUpdate: Joi.object({
    fullName: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional().allow(''),
    phoneNumber: Joi.string().min(10).max(15).optional(),
    username: Joi.string().min(3).max(30).optional(),
    role: Joi.string()
      .valid("Manager", "Cashier", "Waiter", "Kitchen", "Admin")
      .optional(),
    profilePicture: Joi.string().optional().allow(''),
    dateOfJoining: Joi.date().optional(),
    gender: Joi.string().valid("Male", "Female", "Other").optional(),
    branch: Joi.string().optional().allow(''),
    supervisor: Joi.string().optional().allow(''),
    shiftStart: Joi.string().optional().allow(''),
    shiftEnd: Joi.string().optional().allow(''),
    autoAddToAttendance: Joi.boolean().optional(),
    baseSalary: Joi.number().min(0).optional(),
    paymentMode: Joi.string().valid("Cash", "Bank Transfer", "Cheque", "UPI").optional().allow(''),
    tipCommissionEligible: Joi.boolean().optional(),
    bankName: Joi.string().optional().allow(''),
    ifscCode: Joi.string().optional().allow(''),
    accountNumber: Joi.string().optional().allow(''),
    internalNotes: Joi.string().optional().allow(''),
    isActive: Joi.boolean().optional(),
    restaurantId: Joi.string().optional().allow('', null),
    updatedBy: Joi.string().optional().allow('', null),
  }),
  passwordChange: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/)
      .message(
        "New password must contain uppercase, lowercase, and a number"
      )
      .required()
  }),

  restaurant: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().max(15).optional(),
    website: Joi.string().uri().optional(),
    address: Joi.object({
      street: Joi.string().max(500).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional(),
      country: Joi.string().max(500).optional(),
    }).optional(),
    licenseKey: Joi.string().uppercase().optional(),
    currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP').optional(),
    timezone: Joi.string().optional(),
    taxRate: Joi.number().min(0).max(100).optional(),
    maxTables: Joi.number().min(1).optional(),
    maxStaff: Joi.number().min(1).optional()
  }),
  //new
  updateRestaurant: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().max(15).optional(),
    website: Joi.string().uri().optional(),
    address: Joi.object({
      street: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional(),
      country: Joi.string().max(100).optional()
    }).optional(),
    currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP').optional(),
    timezone: Joi.string().optional(),
    taxRate: Joi.number().min(0).max(100).optional(),
    maxTables: Joi.number().min(1).optional(),
    maxStaff: Joi.number().min(1).optional(),
    isActive: Joi.boolean().optional()
  })

}  // end
//new validtore function
exports.validate = validate;
exports.schemas = schemas;

exports.validateLogin = validate(schemas.login)
exports.validateStaffRegistration = validate(schemas.staffRegistration)
exports.validateStaffUpdate = validate(schemas.staffUpdate)
exports.validatePasswordChange = validate(schemas.passwordChange)

