// import * as licenseService from '../services/licenseService.js';
// import { sendSuccess, sendError} from '../utils/response.js';


// // Generate license for current user
// export const generateLicense =async (req , res, next) => {
//     try {
//         const userId =req.user.userId;
//         const license = await licenseService.createLicense(userId);
//         sendSuccess(res, 'License generates successfully', license, 201)


//     }catch(error){
//         next(error);
//     }
// };

// // Get license for current user
// export const getMyLicense =async (req, res, next) => {
//     try {
//         const userId =req.user.userId;
//         const license = await licenseService.getLicenseByUserId(userId);
//         sendSuccess(res, 'Licence retrieved successfully', license);
//      if(!license){
//         sendError(`license not found`,404)
//      }
//     }catch(error){
//         next(error);

//     }
// }
// //Validate license key
// export const validateLicense =async (req, res, next) => {
//     try {
//         const {licenseKey} = req.body;
//         const license = await licenseService.validateLicense(licenseKey);
//         sendSuccess(res, 'License validated successfully', license);
//     }catch(error){
//         next(error);
        
//     }
// };
// export const getAllLicenses =async (req, res, next) => {
//     try {
//         const licenses = await licenseService.getAllLicenses();
//         sendSuccess(res, 'Licenses retrieved successfully', licenses);

//     }catch(error){
//         next(error);
//     }
// }