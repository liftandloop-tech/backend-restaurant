//total new
import mongoose from 'mongoose'

const licenseSchema = new mongoose.Schema({
    restaurantId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Restaurant",
        required:true
    },
    licenseKey:{
        type:String,
        required:true,
        unique:true,
        index: true
    },
    expiryDate:{
        type:Date,
        required:true
    },
    isUsed:{
        type:Boolean,
        default:false
    },
    activatedAt:{
        type:Date,
        default:null
    }
},{
    timestamps:true
})

// Indexes for performance (licenseKey already indexed via unique:true)
licenseSchema.index({ restaurantId: 1 });
licenseSchema.index({ expiryDate: 1 });
licenseSchema.index({ isUsed: 1 });
licenseSchema.index({ createdAt: -1 });
licenseSchema.index({ restaurantId: 1, isUsed: 1 });


export default mongoose.model("license",licenseSchema);

