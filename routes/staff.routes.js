
const express =require("express");
const { registerStaffController, getAllStaffController, getStaffByIdController, updateStaffController, deleteStaffController, permanentlyDeleteStaffController, changePasswordController, resetPasswordController, getStaffStatsController, getProfileController, updateProfileController, loginStaffController, getActiveStaffByRoleController, getCurrentUserController, getAllActiveStaffController   }=require("../controllers/staffController.js");
const { authMiddleware   } =require("../middlewares/auth.js");
const { validateStaffRegistration, validateStaffUpdate, validateLogin, validatePasswordChange   } =require("../middlewares/validation.js");
const { requireRoles   } =require("../middlewares/roles.js");


const router = express.Router();

// public routes (no authentication required) - Rate limiter removed
router.post('/login', loginStaffController)

// All staff routes below require authentication
router.use(authMiddleware);


//staff registration (restaurant staff with proper permission  can register staff)
router.post('/register', validateStaffRegistration, registerStaffController);


//get staff list ('Restaurant'can view all staff ) -Temproraily allow all authenticated 
router.get('/', (req, res, next) => {
  console.log('=== STAFF LIST ACCESS DEBUG ===');
  console.log('req.user exists:', !!req.user);
  if (req.user) {
    console.log('User ID:', req.user.userId)
    console.log('User role:', req.user.role)
    console.log('User type:', req.user.type)
    console.log('Allowed role:', ['Admin', 'Manager', 'Owner', 'Restaurant']);
    console.log('Roe match:', ['Admin', 'Manager', 'Owner', 'Restaurant'].includes(req.user.role))
  }
  console.log('req.userType:', req.userType);

  //Temprorily bypass role check to test authentication
  next();

}, getAllStaffController)
//get staff statistics
router.get('/stats', requireRoles(['Admin', 'Manager', 'Cashier', 'Owner', 'Restaurant']), getStaffStatsController);


//change password
router.patch('/change-password', validatePasswordChange, changePasswordController);


//indivisual staff member routes (Restaurant can view indivisual staff member)
router.get('/:id', requireRoles(['Admin', 'Manager', 'Owner', 'Restaurant']), getStaffByIdController)
router.put('/:id', requireRoles(['Admin', 'Manager', 'Owner', 'Cashier', 'Restaurant']), validateStaffUpdate, updateStaffController)
router.delete('/:id', requireRoles(['Admin', 'Manager', 'Owner', 'Cashier', 'Restaurant']), deleteStaffController);
//password reset
router.patch('/:id/reset-password', requireRoles(['Admin', 'Cashier', 'Restaurant']), resetPasswordController)

//parameterized delete
router.delete('/:id/permanent', requireRoles(['Admin', 'Cashier', 'Restaurant']), permanentlyDeleteStaffController);

// get active staff by role (for managers to see who is working)
router.get('/active/:role',
  getActiveStaffByRoleController)
// Get all active staff 
router.get('/active/all', requireRoles(['Admin', 'Manager', 'Owner', 'Restaurant']), getAllActiveStaffController)
// get corrent user info(for debugging authentication issues)
router.get('/me', getCurrentUserController);

// Debug: Get all active staff and users (for troubleshooting)
router.get('/debug/users', requireRoles(['Admin', 'Owner', 'Restaurant']), async (req, res) => {
  try {
    const { default: Staff } = await import("../models/staff.js");
    const { default: User } = await import("../models/user.js");

    const activeStaff = await Staff.find({ isActive: true }).select('fullName email phoneNumber role _id');
    const allUsers = await User.find({}).select('name email role _id');

    res.json({
      success: true,
      data: {
        activeStaff: activeStaff.map(s => ({ id: s._id, name: s.fullName, email: s.email, role: s.role })),
        allUsers: allUsers.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;