const ROLES = {
  RESTAURANT: 'Restaurant',
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  WAITER: 'Waiter',
  KITCHEN: 'Kitchen'
};

const ROLE_HIERARCHY = {
  [ROLES.RESTAURANT]: 6,
  [ROLES.OWNER]: 6,
  [ROLES.ADMIN]: 5,
  [ROLES.MANAGER]: 4,
  [ROLES.CASHIER]: 3,
  [ROLES.WAITER]: 2,
  [ROLES.KITCHEN]: 1
};



//Define specific permissions for each role
const PERMISSIONS = {
  [ROLES.WAITER]: {
    canCreateOrder: true,
    canUpdateOrder: true,
    canViewOrders: true,
    canUpdatestatus: ['pending', 'confirmed', 'served'], // can update to served status
    canCancelOrder: true,
    canViewOwnOrders: true,
    canServeCustomer: true,
    cantakeOrder: true
  },



  //kitchen permission - prepare food and manage kitchen
  [ROLES.KITCHEN]: {
    canViewKOTs: true,
    canUpdateKOTStatus: true,
    canManageKitchen: true,
    canPrepareFood: true,
    canViewOrders: true, // for kitchen visibility
    canUpdateOrderStatus: true /// can update cooking status
  },


  //cashier permissions - handles payments and billing
  [ROLES.CASHIER]: {
    canCreateBill: true,
    canProccesPayment: true,
    canViewBills: true,
    canHandleRefunds: false, // only manager can refund
    canViewOrders: true,
    canUpdateOrderStatus: true, // can complete orders after payment
    canManageCash: true,
    canHandleBilling: true

  },



  // manage permissions - manage order proccessing and payments
  [ROLES.MANAGER]: {
    canCreateOrder: true,
    canUpdateOrder: true,
    canViewOrders: true,
    canUpdateOrderStatus: true,// can update to served status
    canCancelOrder: true,
    canViewOrders: true,
    canCreateBill: true,
    canProccesPayment: true,
    canHandleRefunds: true,
    canViewBills: true,
    canViewKOTs: true,
    canUpdateKOTStatus: true,
    canManageStaff: true,
    canManageOperations: true,
    canOverrideActions: true

  },
};

// Add Admin permissions
PERMISSIONS[ROLES.ADMIN] = {
  ...PERMISSIONS[ROLES.MANAGER],
  canManageUsers: true,
  canManageSystem: true,
  canViewAllData: true
};

// Add Owner permissions
PERMISSIONS[ROLES.OWNER] = {
  ...PERMISSIONS[ROLES.ADMIN],
  canDeleteData: true,
  canManageLicenses: true
};

PERMISSIONS[ROLES.RESTAURANT] = PERMISSIONS[ROLES.OWNER];



// Helper function to check if a user has a specific action permission
exports. hasPermission = (userRole, permission) => {
  const rolePermissions = PERMISSIONS[userRole]
  if (!rolePermissions) return false
  return rolePermissions[permission] === true;
}

exports. canUpdateOrderStatus = (userRole, newStatus) => {
  const rolePermissions = PERMISSIONS[userRole]
  if (!rolePermissions || !rolePermissions.canUpdateOrderStatus) return false;
  if (rolePermissions.canUpdateOrderStatus === true) return true;
  // Manager/Admin/Owner can update any status
  return rolePermissions.canUpdateOrderStatus.includes(newStatus)
};

// Middleware to check if staff member is active
exports. requireActiveStaff = async (req, res, next) => {
  try {
    const { default: Staff } = await import("../models/staff.js");
    const staffMember = await Staff.findById(req.user.userId);

    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }

    if (!staffMember.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact your manager."
      });
    }

    // Add staff info to request for use in controllers
    req.staffMember = staffMember;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware for role-based action validation
exports. validateRoleAction = (action, resource) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const rolePermissions = PERMISSIONS[userRole];

    if (!rolePermissions) {
      return res.status(403).json({
        success: false,
        message: "Invalid role permissions"
      });
    }

    // Check if role has permission for the action on the resource
    const permissionKey = `can${action}${resource}`;
    if (!rolePermissions[permissionKey]) {
      return res.status(403).json({
        success: false,
        message: `Your role (${userRole}) does not have permission to ${action.toLowerCase()} ${resource.toLowerCase()}`
      });
    }

    next();
  };
};

exports. requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const userRole = req.user.role;
    const rolesToCheck = allowedRoles.flat();

    if (!rolesToCheck.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions."
      });
    }

    next();
  };
};

exports. requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const minRoleLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userRoleLevel < minRoleLevel) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions."
      });
    }

    next();
  };
};

// export { ROLES };
// export default requireRoles;

exports.ROLES = ROLES;