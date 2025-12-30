import InventoryItem from "../models/inventory.js";
import { AppError } from "../utils/errorHandler.js";


// const InventoryItem = require('../models/inventory.js')
// const {AppError} = require('../utils/errorHandler.js')

export const getInventoryItems = async (filters = {}) => {
  const query = {};
  if (filters.category) query.category = filters.category;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  if (filters.restaurantId) {
    query.restaurantId = filters.restaurantId;
  }
  return await InventoryItem.find(query).sort({ name: 1 });
};

export const getInventoryItemById = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const item = await InventoryItem.findOne(query);
  if (!item) {
    throw new AppError("Inventory item not found", 404);
  }
  return item;
};
//new for w
export const createInventoryItem = async (data) => {
  const item = await InventoryItem.create(data);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.incrementRestaurantStat(data.restaurantId, 'totalInventoryItems');
  } catch (error) {
    console.error('Error updating restaurant stats after inventory item creation:', error);
  }

  return item;
};
// end
export const updateInventoryItem = async (id, data, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const item = await InventoryItem.findOneAndUpdate(query, data, { new: true, runValidators: true });
  if (!item) {
    throw new AppError("Inventory item not found", 404);
  }
  return item;
};
// new for w
export const deleteInventoryItem = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const item = await InventoryItem.findOne(query);
  if (!item) {
    throw new AppError("Inventory item not found", 404);
  }

  // Store restaurantId before deletion for stats update
  const itemRestaurantId = item.restaurantId;

  await InventoryItem.findByIdAndDelete(id);

  // Update restaurant statistics
  try {
    const restaurantService = await import('../services/restaurantService.js');
    await restaurantService.decrementRestaurantStat(itemRestaurantId, 'totalInventoryItems');
  } catch (error) {
    console.error('Error updating restaurant stats after inventory item deletion:', error);
  }

  return item;
};
// end
export const getLowStockItems = async (filters = {}) => {
  const query = {
    $expr: { $lte: ['$currentStock', '$minStockLevel'] }
  };
  if (filters.restaurantId) {
    query.restaurantId = filters.restaurantId;
  }
  return await InventoryItem.find(query).sort({ currentStock: 1 });
};
// new for w
// Vendors
export const getVendors = async (filters = {}) => {
  const Vendor = (await import('../models/vendor.js')).default;
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await Vendor.find(query).sort({ name: 1 });
};

export const createVendor = async (data) => {
  const Vendor = (await import('../models/vendor.js')).default;
  return await Vendor.create(data);
};

// Purchase Orders
export const getPurchaseOrders = async (filters = {}) => {
  const PurchaseOrder = (await import('../models/purchaseOrder.js')).default;
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await PurchaseOrder.find(query)
    .populate('vendorId', 'name')
    .populate('items.inventoryItemId', 'name unit')
    .sort({ createdAt: -1 });
};

export const createPurchaseOrder = async (data) => {
  const PurchaseOrder = (await import('../models/purchaseOrder.js')).default;
  const InventoryItem = (await import('../models/inventory.js')).default;

  const po = await PurchaseOrder.create(data);

  // If status is 'received', update inventory stock
  if (data.status === 'received') {
    for (const item of po.items) {
      await InventoryItem.findByIdAndUpdate(item.inventoryItemId, {
        $inc: { currentStock: item.quantity }
      });
    }
  }

  return po;
};

export const updatePurchaseOrderStatus = async (id, status, restaurantId) => {
  const PurchaseOrder = (await import('../models/purchaseOrder.js')).default;
  const InventoryItem = (await import('../models/inventory.js')).default;

  const po = await PurchaseOrder.findById(id);
  if (!po) throw new AppError("Purchase order not found", 404);

  // Verify restaurantId
  if (restaurantId && po.restaurantId && po.restaurantId.toString() !== restaurantId.toString()) {
    throw new AppError("You don't have permission to update this purchase order", 403);
  }

  const oldStatus = po.status;
  po.status = status;

  if (status === 'received' && oldStatus !== 'received') {
    po.receivedDate = new Date();
    for (const item of po.items) {
      await InventoryItem.findByIdAndUpdate(item.inventoryItemId, {
        $inc: { currentStock: item.quantity }
      });
    }
  }

  await po.save();
  return po;
};

// Wastage
export const getWastage = async (filters = {}) => {
  const Wastage = (await import('../models/wastage.js')).default;
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await Wastage.find(query)
    .populate('inventoryItemId', 'name unit')
    .sort({ date: -1 });
};

export const createWastage = async (data) => {
  const Wastage = (await import('../models/wastage.js')).default;
  const InventoryItem = (await import('../models/inventory.js')).default;

  const wastage = await Wastage.create(data);

  // Decrement inventory stock
  await InventoryItem.findByIdAndUpdate(data.inventoryItemId, {
    $inc: { currentStock: -data.quantity }
  });

  return wastage;
};

// Deduct stock based on order
export const deductStockForOrder = async (orderId) => {
  const Order = (await import('../models/order.js')).default;
  const MenuItem = (await import('../models/menu.js')).default;
  const InventoryItem = (await import('../models/inventory.js')).default;

  const order = await Order.findById(orderId);
  if (!order) return;

  for (const item of order.items) {
    if (item.menuItemId) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (menuItem && menuItem.ingredients && menuItem.ingredients.length > 0) {
        for (const ingredient of menuItem.ingredients) {
          if (ingredient.itemId) {
            const qtyUsed = ingredient.quantity * item.qty;
            await InventoryItem.findByIdAndUpdate(ingredient.itemId, {
              $inc: { currentStock: -qtyUsed }
            });
          }
        }
      }
    }
  }
};
// end