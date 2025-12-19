// import License from '../models/license.js'
// import crypto from 'crypto';
// import User from '../models/user.js';
// import {AppError } from '../utils/errorHandler.js';

 //Generate unique licence key

// export const generateLicenseKey = async (userId) =>{
    // Format: XXXX-XXXX-XXXX-XXXX (16 characters 4 groups)
// const segments = [];
// for(let i = 0; i<4; i++){
//     const segment =crypto.randomBytes(4).toString('hex').toUpperCase();
//     segments.push(segment);

// }
// return segments.join('-');

// };
// // create license for a user
// export const createLicense = async (userId) => {
//     //check if user already has a license
//     const existingLicense = await License.findOne({userId});
//     if(existingLicense){
//         throw new AppError('User already has a license',400);
//     }

//     //generate unique license key
//     let licenseKey;
//     let isUnique = false;
//     while(!isUnique){
//     licenseKey =  generateLicenseKey();
//     isUnique = await License.findOne({licenseKey});
//     if(!exists){
//         isUnique: true;
//     }
// }

//     //create license
//     const license = await License.create({licenseKey,userId,
//     isActive: true
// });

// // Update user with license key

// await User.findByIdAndUpdate(userId,{licenseKey},{new:true});
// return license;
// };
// //Get license by user ID

// export const getLicenseByUserId = async (userId) => {
//     const license = await License.findOne({userId}).populate('userId','name','email')
//     if(!license){
//         throw new AppError('License not found',404)
//     }
//         return license;   
//     };
// //Get velidate  license key

// export const validateLicenseKey = async (licenseKey) => {
//     const license = await License.findOne({licenseKey: licenseKey.toUpperCase(),
//     isActive: true
// });
// if(!license){
//         throw new AppError('License not found',404)
//     }
//     // check if license is expired
//     if(license.expiresAt && new Date() > license.expiresAt){
//         throw new AppError('License has expired',401)
//     }
//     return license;
// };
// // Get all licenses(admin only)

// export const getAllLicenses = async () => {
//     return await License.find().populate('userId','name','email').sort({createdAt: -1 })
   
    
// };
