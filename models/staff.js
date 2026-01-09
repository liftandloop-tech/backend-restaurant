

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'



const staffSchema = new mongoose.Schema({
    fullName: {
        type: String, required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    //profile schema
    profilePicture: {
        type: String,
        default: null
    },
    dateOfJoining: {
        type: Date,
        default: Date.now

    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'], default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['Manager', 'Cashier', 'Admin', 'Waiter', 'Kitchen', 'Bar', 'Owner', 'Delivery'], required: true,
        default: 'Waiter'
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: false // Staff must belong to a restaurant
    },
    branch: {
        type: String,
        default: null
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        default: null
    },
    shiftStart: {
        type: String,
        default: null
    },
    shiftEnd: {
        type: String,
        default: null

    },
    autoAddToAttendance: {
        type: Boolean,
        default: false
    },
    //payment credentials
    baseSalary: {
        type: Number,
        default: 0
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI'],
        default: 'Bank Transfer'
    },
    tipCommissionEligible: {
        type: Boolean,
        default: false
    },

    bankName: { type: String, default: null, trim: true },
    ifscCode: {
        type: String, default: null
    },
    accountNumber: {
        type: String, default: null
    },
    //login credentials
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    password: {
        type: String, required: true,
        select: false
    },
    internalNotes: { type: String, default: null },
    //system fields
    lastLogin: { type: Date, default: null },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        default: null

    },

},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }

)
// Additional indexes for better performance
// Note: email, phoneNumber, and username indexes are scoped to restaurantId
staffSchema.index({ role: 1 })
staffSchema.index({ isActive: 1 })
staffSchema.index({ createdAt: -1 })
staffSchema.index({ restaurantId: 1, phoneNumber: 1 }, { unique: true });
staffSchema.index({ restaurantId: 1, email: 1 }, { unique: true, sparse: true });
staffSchema.index({ restaurantId: 1, username: 1 }, { unique: true, sparse: true });

//virtual for staff id
staffSchema.virtual('staffId').get(function () {
    return `ST${this._id.toString().slice(-6).toUpperCase()}`
});
//hash password before save
staffSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();

    } catch (error) {
        next(error)
    }

});
//compare hash password
staffSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)

};
//Remove password from json output
staffSchema.methods.toJSON = function () {
    const staffObject = this.toObject();
    delete staffObject.password;
    return staffObject;
};
export default mongoose.model('Staff', staffSchema)