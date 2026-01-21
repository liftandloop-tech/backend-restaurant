const KOT = require("../models/KOT.js");
const Order = require("../models/order.js");
const Table = require("../models/table.js");
const { AppError } = require("../utils/errorHandler.js");

exports.createKOT = async (orderId, station, userId, userRole, restaurantId) => {
  //validate that active staff can create kots
  const { default: Staff } = await import("../models/staff.js");
  const { default: User } = await import("../models/user.js");

  let staffMember = null;
  let userMember = null;

  //try to find staff first
  staffMember = await Staff.findById(userId);
  if (!staffMember) {
    userMember = await User.findById(userId)
    if (!userMember) {
      throw new AppError(`User not found with ID: ${userId}`, 404)
    }
    // for users (owner/admin/manager), they can always create KOTs

  } else {
    // for staff mamber check if active
    if (!staffMember.isActive) {
      throw new AppError(`Staff member ${staffMember.fullName} is not active. Please contact your manager.`, 403);
    }
  }

  // validate role permission for creating kots(only cashier and above)
  const allowedRoles = ['Cashier', 'Manager', 'Admin', 'Owner']
  if (!allowedRoles.includes(userRole)) {
    throw new AppError("Only cashier and above can create KOTs", 403)
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (!order.items || order.items.length === 0) {
    throw new AppError("Order has no items", 400);
  }

  // Map all order items with complete data for KOT
  const items = order.items.map(item => ({
    name: item.name || '',
    qty: item.qty || 0,
    specialInstructions: item.specialInstructions || undefined
  })).filter(item => item.name && item.qty > 0);

  if (items.length === 0) {
    throw new AppError("No valid items found in order", 400);
  }

  // Generate KOT number before creating KOT
  // This ensures kotNumber is available before Mongoose validation
  const count = await KOT.countDocuments();
  const stationCode = station.substring(0, 3).toUpperCase();
  const kotNumber = `KOT-${stationCode}-${Date.now()}-${String(count + 1).padStart(4, '0')}`;

  const kot = await KOT.create({
    kotNumber,
    orderId,
    station,
    items,
    restaurantId: restaurantId, // Get restaurantId from user
    status: 'pending'
  });

  return await KOT.findById(kot._id).populate('orderId');
};



exports.getKOTs = async (filters = {}, userRole) => {
  // validate that kitchen staff, cashiers, waiters, and managers can view kots
  const allowedRoles = ['Kitchen', 'Cashier', 'Waiter', 'Manager', 'Admin', 'Owner'];
  if (!allowedRoles.includes(userRole)) {
    throw new AppError("You dont have permission to view KOTs", 403)
  }

  const query = {};

  if (filters.station) query.station = filters.station;
  if (filters.status) query.status = filters.status;
  if (filters.orderId) query.orderId = filters.orderId;
  if (filters.restaurantId) query.restaurantId = filters.restaurantId
  const kots = await KOT.find(query)
    .populate({
      path: 'orderId',
      select: 'orderNumber tableNumber items customerId status source createdAt',
      populate: {
        path: 'customerId',
        select: 'name phone email'
      }
    })
    .populate('assignedTo', 'fullName email')
    .populate('printedBy', 'fullName role')
    .sort({ createdAt: -1 })
    .lean();
  // new for w
  // Add table status information to each KOT
  const kotsWithTableStatus = await Promise.all(kots.map(async (kot) => {
    if (kot.orderId && kot.orderId.tableNumber) {
      const table = await Table.findOne({ tableNumber: kot.orderId.tableNumber, restaurantId: kot.restaurantId || filters.restaurantId }).lean();
      if (table) {
        kot.tableStatus = table.status;
        kot.tableCapacity = table.capacity;
        kot.tableLocation = table.location;
      }
    }
    return kot;
  }));

  return kotsWithTableStatus;
};
// end
exports.getKOTById = async (kotId, restaurantId) => {
  const kot = await KOT.findById(kotId)
    .populate({          // new
      path: 'orderId',
      select: 'orderNumber tableNumber items customerId status',
      populate: {
        path: 'customerId',
        select: 'name phone email'
      }
    })
    .populate('assignedTo', 'name email');

  if (!kot) {
    throw new AppError("KOT not found", 404);
  }

  // Ensure KOT belongs to restaurant
  if (restaurantId && kot.restaurantId && kot.restaurantId.toString() !== restaurantId.toString()) {
    throw new AppError("You don't have permission to view this KOT", 403);
  }

  // new for w
  // Add table status information
  if (kot.orderId && kot.orderId.tableNumber) {
    // Use kot.restaurantId for safety
    const table = await Table.findOne({ tableNumber: kot.orderId.tableNumber, restaurantId: kot.restaurantId }).lean();
    if (table) {
      kot.tableStatus = table.status;
      kot.tableCapacity = table.capacity;
      kot.tableLocation = table.location;
    }
  }

  return kot;
};
//end
//new for w

exports.updateKOTStatus = async (kotId, status, userId, userRole, restaurantId) => {
  // validate role permission for updating kot status - allow all active staff based on their roles
  const allowedRoles = ['Kitchen', 'Waiter', 'Cashier', 'Manager', 'Admin', 'Owner'];
  if (!allowedRoles.includes(userRole)) {
    throw new AppError("You dont have permission to update kot status", 403)
  }

  // Role-based status update validation - each role can update specific statuses
  const allowedStatuses = {
    'Kitchen': ['preparing', 'ready'], // Kitchen can prepare and mark ready
    'Waiter': ['sent'], // Waiter can mark as sent after delivery
    'Cashier': ['pending', 'preparing', 'ready', 'sent'], // Cashier can update all statuses
    'Manager': ['pending', 'preparing', 'ready', 'sent'], // Manager can update all statuses
    'Admin': ['pending', 'preparing', 'ready', 'sent'], // Admin can update all statuses
    'Owner': ['pending', 'preparing', 'ready', 'sent'] // Owner can update all statuses
  };
  //end
  const userAllowedStatuses = allowedStatuses[userRole] || [];
  if (!userAllowedStatuses.includes(status)) {
    throw new AppError(`Your role (${userRole}) cannot update KOTs to '${status}' status. Allowed statuses: ${userAllowedStatuses.join(', ')}`, 403)
  }

  // Check if user is active staff (for Staff model) or valid user (for User model)
  const { default: Staff } = await import("../models/staff.js");
  const { default: User } = await import("../models/user.js");

  let staffMember = await Staff.findById(userId);
  let userMember = null;

  if (!staffMember) {
    // Check if it's a User (Admin, Owner, Manager)
    userMember = await User.findById(userId);
    if (!userMember) {
      throw new AppError("User not found", 404);
    }
    // Users (Manager, Admin, Owner) can always update KOT status
  } else {
    // For staff members (Kitchen, Waiter, Cashier), check if active
    if (!staffMember.isActive) {
      throw new AppError("Only active staff can update KOT status", 403);
    }
  }

  const kot = await KOT.findById(kotId);

  if (!kot) {
    throw new AppError("KOT not found", 404);
  }

  // Ensure the KOT belongs to the user's restaurant
  if (kot.restaurantId.toString() !== restaurantId.toString()) {
    throw new AppError("You can only update KOTs from your restaurant", 403);
  }

  kot.status = status;

  if (status === 'preparing' && !kot.startedAt) {
    kot.startedAt = new Date();
    kot.assignedTo = userId;
    // new for w
    // Decrement inventory when preparation starts
    await decrementInventoryForKOT(kot);
  }
  //end
  if (status === 'ready') {
    kot.completedAt = new Date();
  }

  // Note: KOT status 'sent' should not automatically update order status to 'served'
  // Waiters should manually mark orders as 'served' after delivery
  // KOTs should remain visible until bill is printed (order becomes 'completed')

  await kot.save();
  //new for w
  // Automatic Order status update based on KOT status
  try {
    const { default: Order } = await import("../models/order.js");
    const order = await Order.findById(kot.orderId);
    if (order) {
      let orderStatusChanged = false;

      if (status === 'preparing' && ['pending', 'draft'].includes(order.status)) {
        order.status = 'confirmed';
        orderStatusChanged = true;
      } else if (status === 'ready' && ['pending', 'draft', 'confirmed', 'preparing'].includes(order.status)) {
        order.status = 'ready';
        orderStatusChanged = true;
      } else if (status === 'sent' && order.status !== 'served' && order.status !== 'completed') {
        order.status = 'served';
        orderStatusChanged = true;
      }

      if (orderStatusChanged) {
        await order.save();
        console.log(`Automatically updated order ${order.orderNumber} status to ${order.status} based on KOT status ${status}`);
      }
    }
  } catch (orderUpdateError) {
    console.error('Failed to automatically update order status from KOT:', orderUpdateError);
    // We don't throw here to avoid failing the KOT update if order update fails
  }
  //end
  return await KOT.findById(kot._id).populate('orderId').populate('assignedTo', 'name email');
};
//new written
exports.markKOTPrinted = async (kotId, userId, userRole, restaurantId) => {
  // Validate user permissions
  const allowedRoles = ['Cashier', 'Kitchen', 'Manager', 'Admin', 'Owner'];
  if (!allowedRoles.includes(userRole)) {
    throw new AppError("Only authorized staff can mark KOTs as printed", 403);
  }

  // First check if KOT exists and belongs to user's restaurant
  const existingKot = await KOT.findById(kotId);
  if (!existingKot) {
    throw new AppError("KOT not found", 404);
  }

  // Ensure the KOT belongs to the user's restaurant
  if (existingKot.restaurantId.toString() !== restaurantId.toString()) {
    throw new AppError("You can only update KOTs from your restaurant", 403);
  }

  const kot = await KOT.findByIdAndUpdate(
    kotId,
    {
      isPrinted: true,
      printedAt: new Date(),
      printedBy: userId
    },
    { new: true }
  )
    .populate('orderId')
    .populate('printedBy', 'fullName role');

  if (!kot) {
    throw new AppError("KOT not found", 404);
  }

  return kot;
};
//end
exports.getKOTsByStatus = async (status, userRole, restaurantId) => {
  // Validate user permissions
  const allowedRoles = ['Kitchen', 'Cashier', 'Manager', 'Admin', 'Owner'];
  if (!allowedRoles.includes(userRole)) {
    throw new AppError("You don't have permission to view KOTs", 403);
  }

  // Define status-based queries
  let query = { status, restaurantId };

  // Role-based filtering
  if (userRole === 'Kitchen') {
    // Kitchen can only see their assigned KOTs or pending ones
    query = {
      ...query,
      $or: [
        { assignedTo: { $exists: true } },
        { status: 'pending' }
      ]
    };
  }
  //new for w
  const kots = await KOT.find(query)
    .populate({
      path: 'orderId',
      select: 'orderNumber tableNumber items customerId status',
      populate: {
        path: 'customerId',
        select: 'name phone'
      }
    })

    .populate('assignedTo', 'fullName')
    .populate('printedBy', 'fullName')
    .sort({ createdAt: -1 })
    .lean();

  // Add table status information to each KOT
  const kotsWithTableStatus = await Promise.all(kots.map(async (kot) => {
    if (kot.orderId && kot.orderId.tableNumber) {
      const table = await Table.findOne({ tableNumber: kot.orderId.tableNumber, restaurantId }).lean();
      if (table) {
        kot.tableStatus = table.status;
        kot.tableCapacity = table.capacity;
        kot.tableLocation = table.location;
      }
    }
    return kot;
  }));

  return kotsWithTableStatus;
};
// end
exports.getKOTsForOrder = async (orderId, userRole, restaurantId) => {
  // Validate user permissions
  const allowedRoles = ['Waiter', 'Cashier', 'Kitchen', 'Manager', 'Admin', 'Owner'];
  if (!allowedRoles.includes(userRole)) {
    throw new AppError("You don't have permission to view KOTs", 403);
  }
  //new for w
  // Ensure we search by orderId AND restaurantId to prevent data leakage
  const query = { orderId };
  if (restaurantId) query.restaurantId = restaurantId;

  const kots = await KOT.find(query)
    .populate({
      path: 'orderId',
      select: 'orderNumber tableNumber items customerId status',
      populate: {
        path: 'customerId',
        select: 'name phone'
      }
    })
    // end
    .populate('assignedTo', 'fullName')
    .populate('printedBy', 'fullName')
    .sort({ createdAt: -1 })
    .lean();
  //new for w
  // Add table status information to each KOT
  const kotsWithTableStatus = await Promise.all(kots.map(async (kot) => {
    if (kot.orderId && kot.orderId.tableNumber) {
      const table = await Table.findOne({ tableNumber: kot.orderId.tableNumber, restaurantId }).lean();
      if (table) {
        kot.tableStatus = table.status;
        kot.tableCapacity = table.capacity;
        kot.tableLocation = table.location;
      }
    }
    return kot;
  }));

  return kotsWithTableStatus;
};

exports.updateKOTItems = async (kotId, items, userId, userRole, restaurantId) => {
  // Only kitchen staff can update KOT items
  const allowedRoles = ['Kitchen', 'Manager', 'Admin', 'Owner'];
  if (!allowedRoles.includes(userRole)) {
    throw new AppError("Only kitchen staff can update KOT items", 403);
  }

  const kot = await KOT.findById(kotId);
  if (!kot) {
    throw new AppError("KOT not found", 404);
  }


  // Ensure the kot belongs to the user's restaurant
  if (kot.restaurantId.toString() !== restaurantId.toString()) {
    throw new AppError("You can only update kts from your restaurant", 403)
  }

  // Update items with preparation status
  kot.items = items.map(item => ({
    ...item,
    preparedAt: item.isPrepared ? new Date() : undefined,
    preparedBy: item.isPrepared ? userId : undefined
  }));

  // Check if all items are prepared
  const allPrepared = kot.items.every(item => item.isPrepared);
  if (allPrepared && kot.status !== 'ready') {
    kot.status = 'ready';
    kot.completedAt = new Date();
  } else if (!allPrepared && kot.status === 'ready') {
    kot.status = 'preparing';
  }
  //new for w
  await kot.save();

  // Automatic Order status update based on KOT status
  try {
    const { default: Order } = await import("../models/order.js");
    const order = await Order.findById(kot.orderId);
    if (order) {
      let orderStatusChanged = false;
      const currentKotStatus = kot.status;

      if (currentKotStatus === 'ready' && ['pending', 'draft', 'confirmed', 'preparing'].includes(order.status)) {
        order.status = 'ready';
        orderStatusChanged = true;
      } else if (currentKotStatus === 'preparing' && ['pending', 'draft'].includes(order.status)) {
        order.status = 'confirmed';
        orderStatusChanged = true;
      }

      if (orderStatusChanged) {
        await order.save();
        console.log(`Automatically updated order ${order.orderNumber} status to ${order.status} based on KOT update (KOT status: ${currentKotStatus})`);
      }
    }
  } catch (orderUpdateError) {
    console.error('Failed to automatically update order status from KOT item update:', orderUpdateError);
  }

  return await KOT.findById(kot._id)
    .populate('orderId')
    .populate('assignedTo', 'fullName')
    .populate('printedBy', 'fullName');
};
// new for w
/**
 * Decrement inventory items based on KOT items and their ingredients
 */
const decrementInventoryForKOT = async (kot) => {
  try {
    const { default: MenuItem } = await import("../models/menu.js");
    const { default: InventoryItem } = await import("../models/inventory.js");

    for (const item of kot.items) {
      // Find the menu item to get ingredients
      let menuItem;
      if (item.menuItemId) {
        menuItem = await MenuItem.findById(item.menuItemId);
      } else {
        // Fallback to name search if menuItemId is missing
        menuItem = await MenuItem.findOne({ name: item.name, restaurantId: kot.restaurantId });
      }

      if (menuItem && menuItem.ingredients && menuItem.ingredients.length > 0) {
        for (const ingredient of menuItem.ingredients) {
          if (ingredient.itemId && ingredient.quantity) {
            const decrementQty = ingredient.quantity * item.qty;
            // Decrement stock and check for low inventory
            const updatedItem = await InventoryItem.findByIdAndUpdate(
              ingredient.itemId,
              { $inc: { currentStock: -decrementQty } },
              { new: true }
            );

            if (updatedItem) {
              console.log(`Decremented inventory item ${updatedItem.name} (${ingredient.itemId}) by ${decrementQty} for KOT ${kot.kotNumber}`);

              if (updatedItem.currentStock <= updatedItem.minStockLevel) {
                console.warn(`LOW STOCK ALERT: ${updatedItem.name} is below minimum stock level! Current: ${updatedItem.currentStock}, Min: ${updatedItem.minStockLevel}`);
                // Here you could trigger a notification or alert event
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error decrementing inventory for KOT:', error);
  }
};
// end