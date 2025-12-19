// import Staff from "../models/staff.js";
// import { AppError } from "../utils/errorHandler.js";
// import jwt from "jsonwebtoken";
// import { ENV } from '../config/env.js';
// import { addToBlacklist } from "../middlewares/auth.js";

// /**
//  * Register a new staff member
//  * @param {Object} staffData - Staff registration data
//  * @returns {Object} Created staff data (without password)
//  */
// export const registerStaff = async (staffData) => {
//     const {
//         fullName,
//         phoneNumber,
//         email,
//         username,
//         password,
//         role,
//         profilePicture,
//         dateOfJoining,
//         gender,
//         branch,
//         supervisor,
//         shiftStart,
//         shiftEnd,
//         autoAddToAttendance,
//         baseSalary,
//         paymentMode,
//         tipCommissionEligible,
//         bankName,
//         ifscCode,
//         accountNumber,
//         internalNotes,
//         createdBy
//     } = staffData;

//     // Check if email already exists (if provided)
//     if (email) {
//         const emailExists = await Staff.findOne({ email });
//         if (emailExists) {
//             throw new AppError('Staff with this email already exists', 400);
//         }
//     }

//     // Check if phone number already exists
//     const phoneExists = await Staff.findOne({ phoneNumber });
//     if (phoneExists) {
//         throw new AppError('Staff with this phone number already exists', 400);
//     }

//     // Check if username already exists
//     const usernameExists = await Staff.findOne({ username });
//     if (usernameExists) {
//         throw new AppError('Staff with this username already exists', 400);
//     }

//     // Create new staff
//     const staff = await Staff.create({
//         fullName,
//         phoneNumber,
//         email,
//         username,
//         password,
//         role,
//         profilePicture,
//         dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
//         gender,
//         branch,
//         supervisor,
//         shiftStart,
//         shiftEnd,
//         autoAddToAttendance: autoAddToAttendance || false,
//         baseSalary: baseSalary || 0,
//         paymentMode: paymentMode || 'Bank Transfer',
//         tipCommissionEligible: tipCommissionEligible || false,
//         bankName,
//         ifscCode,
//         accountNumber,
//         internalNotes,
//         createdBy
//     });

//     return staff;
// };

// /**
//  * Login staff member
//  * @param {string} identifier - Email or username
//  * @param {string} password - Password
//  * @returns {Object} Login response with staff data and tokens
//  */
// export const loginStaff = async (identifier, password) => {
//     // Find staff by email or username
//     const staff = await Staff.findOne({
//         $or: [
//             { email: identifier },
//             { username: identifier }
//         ]
//     }).select("+password");

//     if (!staff) {
//         throw new AppError("Invalid credentials", 401);
//     }

//     // Check password
//     if (!(await staff.comparePassword(password))) {
//         throw new AppError("Invalid credentials", 401);
//     }

//     // Check if account is active
//     if (!staff.isActive) {
//         throw new AppError("Account is deactivated", 401);
//     }

//     // Update last login
//     staff.lastLogin = new Date();
//     await staff.save();

//     // Generate tokens
//     const accessToken = jwt.sign(
//         {
//             id: staff._id,
//             role: staff.role,
//             type: 'staff'
//         },
//         ENV.JWT_SECRET,
//         { expiresIn: ENV.JWT_EXPIRES_IN || '15m' }
//     );

//     const refreshToken = jwt.sign(
//         {
//             id: staff._id,
//             type: 'staff'
//         },
//         ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET,
//         { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN || '7d' }
//     );

//     return {
//         staff: {
//             _id: staff._id,
//             staffId: staff.staffId,
//             fullName: staff.fullName,
//             email: staff.email,
//             username: staff.username,
//             role: staff.role,
//             phoneNumber: staff.phoneNumber,
//             profilePicture: staff.profilePicture,
//             isActive: staff.isActive,
//             lastLogin: staff.lastLogin
//         },
//         accessToken,
//         refreshToken
//     };
// };

// /**
//  * Get all staff members with pagination and filters
//  * @param {Object} options - Query options
//  * @returns {Object} Paginated staff data
//  */
// export const getAllStaff = async (options = {}) => {
//     const {
//         page = 1,
//         limit = 10,
//         search,
//         role,
//         isActive,
//         branch,
//         sortBy = 'createdAt',
//         sortOrder = 'desc'
//     } = options;

//     const query = {};

//     // Add filters
//     if (search) {
//         query.$or = [
//             { fullName: { $regex: search, $options: 'i' } },
//             { email: { $regex: search, $options: 'i' } },
//             { username: { $regex: search, $options: 'i' } },
//             { phoneNumber: { $regex: search, $options: 'i' } }
//         ];
//     }

//     if (role) {
//         query.role = role;
//     }

//     if (isActive !== undefined) {
//         query.isActive = isActive;
//     }

//     if (branch) {
//         query.branch = branch;
//     }

//     // Calculate pagination
//     const skip = (page - 1) * limit;
//     const sortOptions = {};
//     sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

//     // Execute query
//     const staff = await Staff.find(query)
//         .populate('supervisor', 'fullName staffId')
//         .populate('createdBy', 'fullName staffId')
//         .sort(sortOptions)
//         .skip(skip)
//         .limit(limit)
//         .lean();

//     const total = await Staff.countDocuments(query);
//     const totalPages = Math.ceil(total / limit);

//     return {
//         staff,
//         pagination: {
//             currentPage: page,
//             totalPages,
//             totalItems: total,
//             itemsPerPage: limit,
//             hasNext: page < totalPages,
//             hasPrev: page > 1
//         }
//     };
// };

// /**
//  * Get staff member by ID
//  * @param {string} staffId - Staff ID
//  * @returns {Object} Staff data
//  */
// export const getStaffById = async (staffId) => {
//     const staff = await Staff.findById(staffId)
//         .populate('supervisor', 'fullName staffId email phoneNumber')
//         .populate('createdBy', 'fullName staffId');

//     if (!staff) {
//         throw new AppError('Staff member not found', 404);
//     }

//     return staff;
// };

// /**
//  * Update staff member
//  * @param {string} staffId - Staff ID
//  * @param {Object} updateData - Data to update
//  * @param {string} updatedBy - ID of user making the update
//  * @returns {Object} Updated staff data
//  */
// export const updateStaff = async (staffId, updateData, updatedBy) => {
//     const {
//         fullName,
//         phoneNumber,
//         email,
//         username,
//         role,
//         profilePicture,
//         dateOfJoining,
//         gender,
//         isActive,
//         branch,
//         supervisor,
//         shiftStart,
//         shiftEnd,
//         autoAddToAttendance,
//         baseSalary,
//         paymentMode,
//         tipCommissionEligible,
//         bankName,
//         ifscCode,
//         accountNumber,
//         internalNotes
//     } = updateData;

//     // Check if staff exists
//     const existingStaff = await Staff.findById(staffId);
//     if (!existingStaff) {
//         throw new AppError('Staff member not found', 404);
//     }

//     // Check for unique constraints if being updated
//     if (email && email !== existingStaff.email) {
//         const emailExists = await Staff.findOne({ email, _id: { $ne: staffId } });
//         if (emailExists) {
//             throw new AppError('Email already in use', 400);
//         }
//     }

//     if (phoneNumber && phoneNumber !== existingStaff.phoneNumber) {
//         const phoneExists = await Staff.findOne({ phoneNumber, _id: { $ne: staffId } });
//         if (phoneExists) {
//             throw new AppError('Phone number already in use', 400);
//         }
//     }

//     if (username && username !== existingStaff.username) {
//         const usernameExists = await Staff.findOne({ username, _id: { $ne: staffId } });
//         if (usernameExists) {
//             throw new AppError('Username already in use', 400);
//         }
//     }

//     // Update staff
//     const updatedStaff = await Staff.findByIdAndUpdate(
//         staffId,
//         {
//             fullName,
//             phoneNumber,
//             email,
//             username,
//             role,
//             profilePicture,
//             dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : undefined,
//             gender,
//             isActive,
//             branch,
//             supervisor,
//             shiftStart,
//             shiftEnd,
//             autoAddToAttendance,
//             baseSalary,
//             paymentMode,
//             tipCommissionEligible,
//             bankName,
//             ifscCode,
//             accountNumber,
//             internalNotes,
//             updatedBy
//         },
//         {
//             new: true,
//             runValidators: true
//         }
//     ).populate('supervisor', 'fullName staffId')
//      .populate('createdBy', 'fullName staffId');

//     return updatedStaff;
// };

// /**
//  * Delete staff member (soft delete by setting isActive to false)
//  * @param {string} staffId - Staff ID
//  * @param {string} deletedBy - ID of user performing the deletion
//  * @returns {Object} Deletion confirmation
//  */
// export const deleteStaff = async (staffId, deletedBy) => {
//     const staff = await Staff.findById(staffId);

//     if (!staff) {
//         throw new AppError('Staff member not found', 404);
//     }

//     // Soft delete - deactivate the account
//     staff.isActive = false;
//     staff.updatedBy = deletedBy;
//     await staff.save();

//     return {
//         success: true,
//         message: 'Staff member deactivated successfully'
//     };
// };

// /**
//  * Permanently delete staff member
//  * @param {string} staffId - Staff ID
//  * @returns {Object} Deletion confirmation
//  */
// export const permanentlyDeleteStaff = async (staffId) => {
//     const staff = await Staff.findByIdAndDelete(staffId);

//     if (!staff) {
//         throw new AppError('Staff member not found', 404);
//     }

//     return {
//         success: true,
//         message: 'Staff member permanently deleted'
//     };
// };

// /**
//  * Change staff password
//  * @param {string} staffId - Staff ID
//  * @param {string} currentPassword - Current password
//  * @param {string} newPassword - New password
//  * @returns {Object} Success message
//  */
// export const changePassword = async (staffId, currentPassword, newPassword) => {
//     const staff = await Staff.findById(staffId).select('+password');

//     if (!staff) {
//         throw new AppError('Staff member not found', 404);
//     }

//     // Verify current password
//     if (!(await staff.comparePassword(currentPassword))) {
//         throw new AppError('Current password is incorrect', 400);
//     }

//     // Update password (pre-save hook will hash it)
//     staff.password = newPassword;
//     await staff.save();

//     return {
//         success: true,
//         message: 'Password changed successfully'
//     };
// };

// /**
//  * Reset staff password (admin function)
//  * @param {string} staffId - Staff ID
//  * @param {string} newPassword - New password
//  * @param {string} resetBy - ID of admin resetting the password
//  * @returns {Object} Success message
//  */
// export const resetPassword = async (staffId, newPassword, resetBy) => {
//     const staff = await Staff.findById(staffId);

//     if (!staff) {
//         throw new AppError('Staff member not found', 404);
//     }

//     // Update password (pre-save hook will hash it)
//     staff.password = newPassword;
//     staff.updatedBy = resetBy;
//     await staff.save();

//     return {
//         success: true,
//         message: 'Password reset successfully'
//     };
// };

// /**
//  * Get staff statistics
//  * @returns {Object} Staff statistics
//  */
// export const getStaffStats = async () => {
//     const stats = await Staff.aggregate([
//         {
//             $group: {
//                 _id: null,
//                 total: { $sum: 1 },
//                 active: { $sum: { $cond: ['$isActive', 1, 0] } },
//                 inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
//                 byRole: {
//                     $push: {
//                         role: '$role',
//                         isActive: '$isActive'
//                     }
//                 }
//             }
//         }
//     ]);

//     const roleStats = await Staff.aggregate([
//         {
//             $group: {
//                 _id: '$role',
//                 count: { $sum: 1 },
//                 active: { $sum: { $cond: ['$isActive', 1, 0] } }
//             }
//         }
//     ]);

//     if (stats.length === 0) {
//         return {
//             total: 0,
//             active: 0,
//             inactive: 0,
//             roles: {}
//         };
//     }

//     const result = stats[0];
//     const roles = {};
//     roleStats.forEach(role => {
//         roles[role._id] = {
//             total: role.count,
//             active: role.active,
//             inactive: role.count - role.active
//         };
//     });

//     return {
//         total: result.total,
//         active: result.active,
//         inactive: result.inactive,
//         roles
//     };
// };
import Staff from '../models/staff.js'
import { AppError } from '../utils/errorHandler.js'
import jwt from 'jsonwebtoken'
import {ENV} from '../config/env.js'
import { addToBlacklist } from '../middlewares/auth.js'
/**
 * register a new staff member
 * @param {object} staffData - staff registration data
 * @returns {object} created staff data
 */
export const registerStaff = async (staffData) => {
    const {
        // new for w
        fullName,phoneNumber,email,username,password,role,restaurantId,profilePicture,dateOfJoining,gender,branch,supervisor,shiftStart,shiftEnd,autoAddToAttendance,baseSalary,paymentMode,tipCommissionEligible,bankName,ifscCode,accountNumber,internalNotes,createdBy

    }= staffData;

    // Validate that restaurantId is provided
    if (!restaurantId) {
        throw new AppError('Restaurant ID is required for staff registration', 400);
    }

    // Validate that the restaurant exists and user has access
    const Restaurant = (await import('../models/restaurant.js')).default;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        throw new AppError('Restaurant not found', 404);
    }

    // Check if the creator has permission (must be owner, admin, or manager of the restaurant)
    if (createdBy) {
        const User = (await import('../models/user.js')).default;
        const creator = await User.findById(createdBy);

        if (!creator) {
            throw new AppError('Staff creator not found', 404);
        }

        // Check if creator belongs to the restaurant
        if (creator.restaurantId?.toString() !== restaurantId.toString()) {
            // If creator doesn't have restaurantId, check if they're the owner
            if (restaurant.ownerId.toString() !== createdBy.toString()) {
                throw new AppError('You do not have permission to create staff for this restaurant', 403);
            }
        }

        // Check if creator has appropriate role
        const allowedRoles = ['Owner', 'Admin', 'Manager'];
        if (!allowedRoles.includes(creator.role)) {
            throw new AppError('Insufficient permissions to create staff', 403);
        }
    }
    // end
    //check if email already exists
    if(email){
        console.log('Checking email:', email);
        const emailExists = await Staff.findOne({email});
        console.log('Email exists result:', !!emailExists);
        if(emailExists){
            throw new AppError('staff with this email already exists',400)
        }
    }
    //check if phone number already exists
    console.log('Checking phone:', phoneNumber);
    const phoneExists = await Staff.findOne({phoneNumber});
    console.log('Phone exists result:', !!phoneExists);
    if(phoneExists){
        throw new AppError('staff with this phone number already exists',400)
    }

    // Validate required fields
    if (!username || username.trim() === '') {
        throw new AppError('Username is required and cannot be empty', 400);
    }

    try {
        // Check if username already exists
        console.log('Checking username:', username);
        const usernameExists = await Staff.findOne({username: username});
        console.log('Username exists result:', !!usernameExists);
        if(usernameExists){
            throw new AppError('staff with this username already exists',400)
        }

        // Create new staff
        console.log('Creating staff with data:', { fullName, phoneNumber,restaurantId, email, username, role });
        const staff = await Staff.create({
            fullName,phoneNumber,email,username,password,role,restaurantId,profilePicture,
            dateOfJoining:dateOfJoining? new Date(dateOfJoining) : new Date(),gender,branch,supervisor,shiftStart,shiftEnd,
            autoAddToAttendance : autoAddToAttendance || false,
            baseSalary:baseSalary || 0,
            paymentMode: paymentMode || 'Bank Transfer',
            tipCommissionEligible:tipCommissionEligible || false,
            bankName,ifscCode,accountNumber,internalNotes,createdBy,
            isActive: true // Explicitly set new staff as active
        });
        console.log('Staff created successfully:', staff._id, 'isActive:', staff.isActive);
// new for w
        // Update restaurant statistics
        try {
            const restaurantService = await import('../services/restaurantService.js');
            await restaurantService.incrementRestaurantStat(restaurantId, 'totalStaff');
        } catch (error) {
            console.error('Error updating restaurant stats after staff creation:', error);
        }

        // end
        return staff;
    } catch (dbError) {
        console.error('Database error in registerStaff:', dbError.message);
        if(dbError.message.includes("MongoServerError") || dbError.name === 'MongoServerError' || dbError.name === 'MongooseError'){
            console.warn('Database not connected, cannot save staff data. Please check MongoDB connection.');
            throw new AppError('Database connection failed. Please try again later.', 500);
        }
        throw dbError;
    }
 };
/**
 * login staff member
 * @param {string} identifier - email or username
 * @param {string} password -password
 * @param {object} Login response with staff data and tokens
 */
export const loginStaff = async (identifier,password) => {
    //find staff by email or usrename
    const staff = await Staff.findOne({$or:[{email:identifier},{username:identifier}]})
    .select('+password');
    if(!staff){
        throw new AppError('Invalid credentail',401)
    }
    //check password
    if(!(await staff.comparePassword(password))){
        throw new AppError('Invalid credential',401);
    }
    //check if account is active
    if(!staff.isActive){
        throw new AppError('Account is deactivated',401);

    }
    //update last login
    staff.lastLogin = new Date();
    await staff.save()

    //generate tokens
    const accessToken = jwt.sign({
        id:staff._id,
        role:staff.role,
        type:'staff'
    },
      ENV.JWT_SECRET,
      {expiresIn:ENV.JWT_ACCESS_EXPIRE || '15m'}

);
const refreshToken =jwt.sign({
    id:staff._id,
    type:'staff'
},
ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET,
{expiresIn:ENV.JWT_REFRESH_EXPIRES_IN || '7d'}

);
return{ 
    staff:{
        _id:staff._id,
        staffId:staff.staffId,
        fullName:staff.fullName,
        email:staff.email,
        username:staff.username,
        role:staff.role,
        phoneNumber:staff.phoneNumber,
        profilePicture:staff.profilePicture,
        isActive:staff.isActive,
        lastLogin:staff.lastLogin

    },
    accessToken,
    refreshToken
};
};
/**
 * get all staff members with pagination and filters
 * @param {object} options - query options
 * @returns {object} paginated staff data
 */
export const getAllStaff = async (options = {}) => {
    const {
        page = 1,
        limit = 10,
        search,role,isActive,branch,sortBy = 'createdAt',sortOrder = 'desc'
    } =options;
    const query ={}
    console.log('getAllStaff - Original params:', { page, limit, search, role, isActive, branch, sortBy, sortOrder });

    //add filters

    if(search){
        query.$or = [
            {fullName:{$regex:search,$options:'i'}},
            {email:{$regex:search,$options:'i'}},
            {username:{$regex:search,$options:'i'}},
            {phoneNumber:{$regex:search,$options:'i'}},

                   ];
    }
    if(role)
{
     query.role =role
}
    if(isActive !== undefined){
        query.isActive = isActive;
        console.log('getAllStaff - Applying isActive filter:', isActive);
    }

    console.log('getAllStaff - Final query:', JSON.stringify(query, null, 2));
    if(branch){
        query.branch = branch;
    }
    
    // calculate pagination 
    const skip = (page - 1) * limit;
    const sortOptions ={}
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    //execute query 
    // try{
    // const staff =await Staff.find(query)
    // .populate('supervisor', 'fullName staffId')
    // .populate('createdBy', 'fullName staffId')
    // .sort(sortOptions)
    // .skip(skip)
    // .limit(limit)
    // .lean();

    //     const total = await Staff.countDocuments(query);
    //     const totalPages= Math.ceil(total / limit)

    //     return{
    //         staff,
    //         pagination:{
    //             currentPage:page,
    //             totalPages,
    //             totalItems:total,
    //             itemsPerPage:limit,
    //             hasNext:page < totalPages,
    //             hasPrev:page > 1
    //         }
    //     };
    // } catch (dbError) {     //new
    //     // If database is not connected, return mock data for testing
    //     if (dbError.message.includes('MongoServerError') || dbError.name === 'MongooseError') {
    //         console.warn('⚠️  Database not connected, returning mock staff data for testing');
    //         const mockStaff = [
    //             {
    //                 _id: 'mock-1',
    //                 fullName: 'John Doe',
    //                 phoneNumber: '1234567890',
    //                 email: 'john.doe@example.com',
    //                 username: 'johndoe',
    //                 role: 'Waiter',
    //                 dateOfJoining: new Date(),
    //                 gender: 'Male',
    //                 isActive: true,
    //                 shiftStart: '09:00',
    //                 shiftEnd: '17:00',
    //                 autoAddToAttendance: false,
    //                 baseSalary: 50000,
    //                 paymentMode: 'Monthly',
    //                 tipCommissionEligible: true,
    //                 bankName: 'Test Bank',
    //                 ifscCode: 'TEST0001',
    //                 accountNumber: '123456789',
    //                 createdAt: new Date(),
    //                 updatedAt: new Date(),
    //                 staffId: 'MOCK001'
    //             }
    //         ];

    //         return {
    //             staff: mockStaff,
    //             pagination: {
    //                 currentPage: 1,
    //                 totalPages: 1,
    //                 totalItems: 1,
    //                 itemsPerPage: limit,
    //                 hasNext: false,
    //                 hasPrev: false
    //             }
    //         };
    //     }
    //     throw dbError;
    // }
    try{
        const staff =await Staff.find(query)
        .populate('supervisor', 'fullName staffId')
         .populate('createdBy', 'fullName staffId')
       .sort(sortOptions)
       .skip(skip)
       .limit(limit)
       .lean();
       const total =await Staff.countDocuments(query)
       const totalPages = Math.ceil(total/limit)

       console.log('getAllStaff - Query results:', {
         totalFound: total,
         returnedCount: staff.length,
         isActiveFilter: isActive,
         query: JSON.stringify(query, null, 2)
       });

       // Log first few staff members for debugging
       if (staff.length > 0) {
         console.log('getAllStaff - Sample results:', staff.slice(0, 2).map(s => ({
           id: s._id,
           fullName: s.fullName,
           username: s.username,
           isActive: s.isActive,
           role: s.role
         })));
       }

       return{
        staff,
        pagination:{
            currentPage:page,
            totalPages,
            totalItems:total,
            itemsPerPage:limit,
            hasNext:page < totalPages,
            hasPrev:page > 1
        }
       }
        }catch(dbError){
            if(dbError.message.includes("MongoServerError") || dbError.name === 'MongoServerError'){
                console.warn("Database not connected returning mock staff data for testing")
                const mockStaff = [
                    {
                        _id: 'mock-1',
                        fullName: 'John Deo',
                        phoneNumber: '1234567890',
                        email: 'John.doe@example.com',
                        username: 'johndoe',
                        password: 'password123',
                        role:'Waiter',
                        dateOfJoining: new Date(),
                        gender:'Male',
                        branch:'Main Branch',
                        
                        shiftStart:'09:00',
                        shiftEnd:'17:00',
                        autoAddToAttendance: false,
                        baseSalary: 50000,
                        paymentMode: 'Bank Transfer',
                       tipCommissionEligible:true,
                       bankName:'Test Bank',
                       ifscCode:'TEST0001',
                       accountNumber:'123456789',
                       internalNotes:'Test staff member',
                       createdBy:new Date(), 
                       updatedAt: new Date(),
                       staffId: 'MOCK001'
            
                    
                    }
                ];
                return{
                    staff:mockStaff,
                    pafination:{
                        currentPage:1,
                        totalPages:1,
                        totalItems:1,
                        itemsPerPage:limit,
                        hasNext:false,
                        hasPrev:false

                    }

                }
            };
            throw dbError;
        }
};

/**
 * get staff member by id
 * @param {string} staffId - staff id
 * @returns {object} staff data
 */
export const getStaffById = async (staffId) => {
    const staff = await Staff.findById(staffId)
    .populate('supervisor', 'fullName staffId')
    .populate('createdBy', 'fullName staffId')

    if(!staff){
        throw new AppError('staff member not found',404)
    }
    return staff;

};

/**
 * update staff member
 * @param {string} staffId - staff id
 * @param {object} updateData - update data
 * @param {string} updatedBy - updated by
 * @returns {object} staff data
 * 
 */
export const updateStaff = async (staffId ,updateData,updatedBy) => {
    const {fullName,phoneNumber,email,username,password,role,profilePicture,dateOfJoining,gender,branch,supervisor,shiftStart,shiftEnd,autoAddToAttendance,baseSalary,paymentMode,tipCommissionEligible,bankName,ifscCode,accountNumber,internalNotes
    }= updateData;

    //check if staff exists
    const existingStaff = await Staff.findById(staffId);
    if(!existingStaff){
        throw new AppError('staff member not found ',404)
    }
    //check for unique constraints if being updated
if(email && email !== existingStaff.email){
    const emailExists = await Staff.findOne({email,_id:{$ne:staffId}})
    if(emailExists){
        throw new AppError('email already in use',400)
    }
}
if(phoneNumber && phoneNumber !== existingStaff.phoneNumber){
    const phoneExists = await Staff.findOne({phoneNumber,_id:{$ne:staffId}})
    if(phoneExists){
        throw new AppError('phone number already in use',400)
    }
}

if(username && username !== existingStaff.username){
    const usernameExists = await Staff.findOne({username,_id:{$ne:staffId}})
    if(usernameExists){
        throw new AppError('username  already in use',400)
    }
}

//update staff 
const updatestaff = await Staff.findByIdAndUpdate(
    staffId,
    {
        fullName,phoneNumber,email,username,password,role,profilePicture,dateOfJoining,gender,branch,supervisor,shiftStart,shiftEnd,autoAddToAttendance,baseSalary,paymentMode,tipCommissionEligible,bankName,ifscCode,accountNumber,internalNotes,updatedBy
        
    },
{
    new:true,
    runValidators:true
}).populate('supervisor', 'fullName staffId')
.populate('createdBy', 'fullName staffId')
return updatestaff;

};

/**
 * delete staff member
 * @param {string} staffId - staff id
 * @param {string} deletedBy - deleted by
 * @returns {object} staff data
 */
export const deleteStaff = async (staffId,deletedBy) => {
    const staff = await Staff.findById(staffId);
    if(!staff){
        throw new AppError('staff member not found',404)
    }

//soft delete
staff.isActive = false;
staff.updatedBy = deletedBy;
await staff.save();

// Update restaurant statistics
try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.decrementRestaurantStat(staff.restaurantId, 'totalStaff');
} catch (error) {
    console.error('Error updating restaurant stats after staff deactivation:', error);
}

return{
    success:true,
    message:'staff member deactivated successfully'
}
}

/**
 * permanently delete staff member
 * @param {string} staffId - staff id
 * @returns {object} staff data
 */
export const permanentlyDeleteStaff = async (staffId) => {
    const staff = await Staff.findByIdAndDelete(staffId);
    if(!staff){
        throw new AppError('staff member not found',404)
    }
    return {
        success:true,
        message:'staff member permanently deleted'
    }
};
/**
 * change staff password
 * @param {string} staffId - staff id
 * @param {string} currentPassword - current password
 * @param {string} newPassword - new password
 * @returns {object} staff data
 */
export const changePassword = async (staffId,currentPassword,newPassword) => {
    const staff = await Staff.findById(staffId).select('+password');
    if(!staff){
        throw new AppError('staff member not found',404)
    }
    //verify current password
    if(!(await staff.comparePassword(currentPassword))){
        throw new AppError('Invalid current password',400)
    }
    //update password
    staff.password = newPassword;
    await staff.save();
    return{
        success:true,
        message:'Password changed successfully'
    }
    
};
/**
 * reset staff password
 * @param {string} staffId - staff id
 * @param {string} newPassword - new password
 * @param {string} resetBy - reset by
 * @returns {object} staff data
 */
export const resetPassword = async (staffId,newPassword,resetBy) => {
    const staff = await Staff.findById(staffId);
    if(!staff){
        throw new AppError('staff member not found',404)
    }
    //update password
    staff.password = newPassword;
    staff.updatedBy = resetBy;
    await staff.save()
    return{
        success:true,
        message:'Password reset successfully'
    };
};
/**
 * get staff statistics
 * @returns {object} staff statistics
 */
export const getStaffStats = async () => {
    const stats = await Staff.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: ['$isActive', 1, 0] } },
                inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
                byRole:{
                    $push:{
                        role:'$role',
                        isActive:'$isActive'

                    }
                }
            }
        }
    ])
const roleStats = await Staff.aggregate([
    {
        $group:{
            _id:'$role',
            count:{$sum:1},
            active:{$sum:{$cond:['$isActive',1,0]}},
        }
    }
]);

if(stats.length === 0){
    return{
        total:0,
        active:0,
        inactive:0,
        roles:{}
    };
}
const result = stats[0];
const roles = {};
roleStats.forEach(role => {
    roles[role._id] = {
        total:role.count,
        active:role.active,
        inactive:role.count - role.active
    }
});

return{
    total:result.total,
    active:result.active,
    inactive:result.inactive,
    roles
}
};
/**
 * get active staff by role
 * @param {string} role - staff role to filter by
 * @param {string} branch- Array of active staff members
 */
export const getActiveStaffByRole = async (role,branch) => {
    try{
        const staff =await Staff.find({
            role:role,
            isActive: true
        }).select('fullName email phoneNumber username role shiftStart shiftEnd').sort({fullName: 1});

        return staff;

    }catch(error){
        throw new AppError('Failed to fetch active staff by role',500)
    }
    
};
/**
* validate if staff member is active and has required role 
 *@param {string} staffId - staff member Id
 *@param {string} requireRole - required role for the action
 *@return {object} staff data  if valid
*/
export const validateActiveStaffRole = async (staffId,requiredRole) => {
    try{
        const staff = await Staff.findById(staffId);
        if(!staff){
            throw new AppError('staff member not found', 404)
        }
         
        if(!staff.isActive){
            throw new AppError('staff member not Active', 404)
        }
        if(staff.role !== requiredRole){
            throw new AppError(`staff member not must be a ${requiredRole }to perform this action`, 404)
        }
        return staff;

    }catch(error){
        if(error instanceof AppError){
            throw error;
        }
        throw new AppError('Failed to validate staff role',500)
    }
}