import {
    registerStaff, loginStaff, getAllStaff, getStaffById,
    updateStaff, deleteStaff, permanentlyDeleteStaff,
    changePassword, resetPassword, getStaffStats, getActiveStaffByRole
} from '../services/staffService.js'
import response, { sendSuccess } from '../utils/response.js'
import { AppError } from '../utils/errorHandler.js'
import { resolveRestaurantId } from "../utils/context.js";

/**
 * register a new staff member
 */
export const registerStaffController = async (req, res, next) => {
    try {
        let restaurantId = req.body.restaurantId;

        if (!restaurantId) {
            // Ensure user has a restaurant (create one if needed)
            let resolved = await resolveRestaurantId(req.user.userId, req);
            if (resolved) restaurantId = resolved;
        }

        if (!restaurantId) {
            throw new AppError('Restaurant ID is required', 400);
        }

        const staffData = {
            ...req.body,
            restaurantId: restaurantId,
            createdBy: req.body.createdBy || req.user?.userId || null
        };

        const staff = await registerStaff(staffData)
        response.success(res, "staff member registered successfully", staff, 201)
    } catch (error) {
        console.error('Staff registration error:', error.message);
        next(error)
    }
};
/**
 * staff login
 */
export const loginStaffController = async (req, res, next) => {

    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            throw new AppError("please provide identifire email/username and password", 400)
        }
        const loginData = await loginStaff(identifier, password);
        response.success(res, "login successfull", loginData)
    } catch (error) {
        next(error)
    }
};
/**
 * get all staff memeber with pagination and filters
 */
export const getAllStaffController = async (req, res, next) => {
    try {
        //new
        let restaurantId = await resolveRestaurantId(req.user.userId, req);

        if (!restaurantId) {
            return response.success(res, "staff member retrieved successfully", {
                data: [],
                pagination: {
                    totalDocs: 0,
                    limit: parseInt(req.query.limit) || 10,
                    totalPages: 0,
                    page: parseInt(req.query.page) || 1,
                    pagingCounter: 0,
                    hasPrevPage: false,
                    hasNextPage: false,
                    prevPage: null,
                    nextPage: null
                }
            })
        }
        //end
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            search: req.query.search,
            role: req.query.role,
            isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
            branch: req.query.branch,
            restaurantId: restaurantId,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc'
        };
        const result = await getAllStaff(options);
        response.success(res, "staff member retrieved successfully", result)
    } catch (error) {
        next(error);
    }
};
/**
 * get staff member by id
 */
export const getStaffByIdController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const staff = await getStaffById(id);
        response.success(res, "staff memeber retrieved successfully", staff);
    } catch (error) {
        next(error);

    }
};
/**
 * update staff member
 */
export const updateStaffController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updatedBy = req.user?.id;
        const staff = await updateStaff(id, updateData, updatedBy);
        response.success(res, "staff member updated successfully", staff)
    } catch (error) {
        next(error);
    }
};
/**
 * delete staff member
 */
export const deleteStaffController = async (req, res, next) => {
    try {
        const { id } = req.params
        const deletedBy = req.user?.id;
        const result = await deleteStaff(id, deletedBy)
        response.success(res, result.message)
    } catch (error) {
        next(error);
    }

}
/**
 * permanently delete staff member
 */

export const permanentlyDeleteStaffController = async (req, res, next) => {
    try {
        const { id } = req.params

        const result = await permanentlyDeleteStaff(id);
        response.success(res, result.message)
    } catch (error) {
        next(error);
    }

};
/**
 * change staff password
 */
export const changePasswordController = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const staffId = req.user.id;
        if (!currentPassword || !newPassword) {
            throw new AppError("please provide current password and new password", 400)
        }
        //basic password validation 
        if (newPassword.length < 6) {
            throw new AppError("new password must be at least 6 characters long", 400)
        }
        const result = await changePassword(staffId, currentPassword, newPassword);
        response.success(res, result.message)

    } catch (error) {
        next(error);
    }
};
/**
 * reset staff password (admin only)
 */
export const resetPasswordController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        const resetBy = req.user.id;
        if (!newPassword) {
            throw new AppError("please provide new password", 400)
        }
        //basic password validation 
        if (newPassword.length < 6) {
            throw new AppError("new password must be at least 6 characters long", 400)
        }
        const result = await resetPassword(id, newPassword, resetBy);
        response.success(res, result.message)
    } catch (error) {
        next(error);
    }
};

/**
 * get staff statistics
 *  
 */
export const getStaffStatsController = async (req, res, next) => {
    try {
        //new
        //new
        let restaurantId = await resolveRestaurantId(req.user.userId, req);

        if (!restaurantId) {
            return response.success(res, "staff statistics retrieved successfully", {
                totalStaff: 0,
                activeStaff: 0,
                totalSalary: 0
            })
        }

        const stats = await getStaffStats(restaurantId);
        //end
        response.success(res, "staff statistics retrieved successfully", stats)
    } catch (error) {
        next(error);

    }
};

/**
 * get current staff profile
 */
export const getProfileController = async (req, res, next) => {
    try {
        const staffId = req.user.id;
        const staff = await getStaffById(staffId);
        response.success(res, "profile retrieved successfully", staff);

    } catch (error) {
        next(error);
    }
};
/**
 * update current staff profile
 */
export const updateProfileController = async (req, res, next) => {
    try {
        const staffId = req.user.id;
        const updateData = req.body;

        //remove sensitive fields that should not be updated via profile
        delete updateData.password;
        delete updateData.role;
        delete updateData.isActive;
        delete updateData.baseSalary;

        const staff = await updateStaff(staffId, updateData, staffId);
        response.success(res, "profile updated successfully", staff);
    } catch (error) {
        next(error);
    }
};

/**
 * get active staff by role
 */
export const getActiveStaffByRoleController = async (req, res, next) => {
    try {
        const { role } = req.params;
        // validate role
        const validRoles = ['Waiter', 'Kitchen', 'Cashier', 'Manager', 'Admin', 'Owner']
        if (!validRoles.includes(role)) {
            throw new AppError("Invalid role specified", 400)
        }
        //end
        let restaurantId = await resolveRestaurantId(req.user.userId, req);

        if (!restaurantId) {
            return sendSuccess(res, `Active${role} staff retrieved successfully`, [])
        }

        const activeStaff = await getActiveStaffByRole(role, restaurantId);
        //end
        sendSuccess(res, `Active${role} staff retrieved successfully`,
            activeStaff)
    } catch (error) {
        next(error);
    }
};
// new for w

// get all active staff grouped by role

export const getAllActiveStaffController = async (req, res, next) => {
    try {
        //new
        //new
        const Staff = (await import('../models/staff.js')).default;

        let restaurantId = await resolveRestaurantId(req.user.userId, req);

        if (!restaurantId) {
            return sendSuccess(res, "Active staff by roll retrieved successfully", {
                roles: {
                    waiter: [], kitchen: [], cashier: [], manager: [], admin: [], owner: []
                },
                summery: {
                    waiter: 0, kitchen: 0, cashier: 0, manager: 0, admin: 0, owner: 0
                }
            });
        }

        //end
        const roles = ['Waiter', 'Kitchen', 'Cashier', 'Manager', 'Admin', 'Owner'];

        const activeStaffByRole = {};
        for (const role of roles) {
            const query = {
                role: role,
                isActive: true
            };
            if (restaurantId) {
                query.restaurantId = restaurantId;
            }
            const staff = await Staff.find(query).select('fullName email phoneNumber username')
                .sort({ fullName: 1 });


            activeStaffByRole[role.toLowerCase()] = staff.map(s => ({
                id: s._id,
                name: s.fullName,
                email: s.email,
                phoneNumber: s.phoneNumber,
                username: s.username
            }));
        }

        sendSuccess(res, "Active staff by roll retrieved successfully", {
            roles: activeStaffByRole,
            summery: Object.keys(activeStaffByRole).reduce((acc, role) => {
                acc[role] = activeStaffByRole[role].length;
                return acc;
            }, {})
        });
    } catch (error) {
        next(error);
    }
};

// end

// get current user info(for debugging authentication issues)


export const getCurrentUserController = async (req, res, next) => {
    try {


        //also check database to verify user/staff status
        const Staff = (await import('../models/staff.js')).default;
        const User = (await import('../models/user.js')).default;

        let dbStatus = 'not_found';
        let staffData = null;
        let userData = null;
        //check if user exists as staff
        const staff = await Staff.findById(req.user.userId)
        if (staff) {
            dbStatus = staff.isActive ? 'active_staff' : 'inactive_staff';
            staffData = {
                fullName: staff.fullName,
                role: staff.role,
                isActive: staff.isActive,
                phoneNumber: staff.phoneNumber
            }
        } else {
            //check if user exists as system user
            const user = await User.findById(req.user.userId).select('-password');
            if (user) {
                dbStatus = 'system_user';
                userData = {
                    name: user.name,
                    role: user.role,
                    email: user.email
                }

            }
        }
        sendSuccess(res, "Current user information retrieved successfully",
            {
                userId: req.user.userId,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                type: req.user.type,
                phoneNumber: req.user.phoneNumber,
                username: req.user.username,
                databaseStatus: dbStatus,
                staffData: staffData,
                userData: userData

            }
        )
    } catch (error) {
        next(error)
    }
}