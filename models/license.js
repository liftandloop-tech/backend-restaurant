// //import mongoose from 'mongoose';
// const mongoose=require('mongoose')
// const licenseSchema = new mongoose.Schema({
//     licenseKey: {
//         type: String,
//         required: true,
//         unique: true,
//         uppercase: true,
//         trim: true
//     },
//     userId:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//         unique: true
//     },
    
    
//  expiryDate: {
//    type: Date,
//    required:true
   
//  },
 
//  isUsed:{
//     type:Boolean,
//     default:false
//  },
//  activatedAt:{
//     type:Date,
//     default:null
//  }
// },{

//     timestamps: true
// })
//     //Index
//     licenseSchema.index({licenseKey: 1 });   
//     licenseSchema.index({userId: 1});
// //export default mongoose.model('License',licenseSchema);
// module.exports=mongoose.model('License,licenseSchema')