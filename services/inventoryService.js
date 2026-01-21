const InventoryItem = require("../models/inventory.js");
const { AppError } = require("../utils/errorHandler.js");

exports.getInventoryItems = async (filters = {}) => {
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

exports.getInventoryItemById = async (id, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const item = await InventoryItem.findOne(query);
  if (!item) {
    throw new AppError("Inventory item not found", 404);
  }
  return item;
};
//new for w
exports.createInventoryItem = async (data) => {
  const item = await InventoryItem.create(data);

  // Update restaurant statistics
  try {
    const { default: restaurantService } = await import("../services/restaurantService.js");
    await restaurantService.incrementRestaurantStat(data.restaurantId, 'totalInventoryItems');
  } catch (error) {
    console.error('Error updating restaurant stats after inventory item creation:', error);
  }

  return item;
};
// end
exports.updateInventoryItem = async (id, data, restaurantId) => {
  const query = { _id: id };
  if (restaurantId) query.restaurantId = restaurantId;

  const item = await InventoryItem.findOneAndUpdate(query, data, { new: true, runValidators: true });
  if (!item) {
    throw new AppError("Inventory item not found", 404);
  }
  return item;
};
// new for w
exports.deleteInventoryItem = async (id, restaurantId) => {
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
    const { default: restaurantService } = await import("../services/restaurantService.js");
    await restaurantService.decrementRestaurantStat(itemRestaurantId, 'totalInventoryItems');
  } catch (error) {
    console.error('Error updating restaurant stats after inventory item deletion:', error);
  }

  return item;
};
// end
exports.getLowStockItems = async (filters = {}) => {
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
exports.getVendors = async (filters = {}) => {
  const { default: Vendor } = await import("../models/vendor.js");
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await Vendor.find(query).sort({ name: 1 });
};

exports.createVendor = async (data) => {
  const { default: Vendor } = await import("../models/vendor.js");
  return await Vendor.create(data);
};

// Purchase Orders
exports.getPurchaseOrders = async (filters = {}) => {
  const { default: PurchaseOrder } = await import("../models/purchaseOrder.js");
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await PurchaseOrder.find(query)
    .populate('vendorId', 'name')
    .populate('items.inventoryItemId', 'name unit')
    .sort({ createdAt: -1 });
};

exports.createPurchaseOrder = async (data) => {
  const { default: PurchaseOrder } = await import("../models/purchaseOrder.js");
  const { default: InventoryItem } = await import("../models/inventory.js");

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

exports.updatePurchaseOrderStatus = async (id, status, restaurantId) => {
  const { default: PurchaseOrder } = await import("../models/purchaseOrder.js");
  const { default: InventoryItem } = await import("../models/inventory.js");

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
exports.getWastage = async (filters = {}) => {
  const { default: Wastage } = await import("../models/wastage.js");
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  return await Wastage.find(query)
    .populate('inventoryItemId', 'name unit')
    .sort({ date: -1 });
};

exports.createWastage = async (data) => {
  const { default: Wastage } = await import("../models/wastage.js");
  const { default: InventoryItem } = await import("../models/inventory.js");

  const wastage = await Wastage.create(data);

  // Decrement inventory stock
  await InventoryItem.findByIdAndUpdate(data.inventoryItemId, {
    $inc: { currentStock: -data.quantity }
  });

  return wastage;
};
// new
// Deduct stock based on order
// Deduct stock based on order
// Helper to infer ingredients based on item name (Fallback logic)
const inferIngredientsFromName = (itemName) => {
  const lowerName = itemName.toLowerCase();
  const ingredients = [];

  // 1. Base Staples (Onion, Garlic, Tomato) - Almost all Indian Mains/Starters use these
  if (
    lowerName.includes('curry') ||
    lowerName.includes('masala') ||
    lowerName.includes('gravy') ||
    lowerName.includes('biryani') ||
    lowerName.includes('fry') ||
    lowerName.includes('tikka') ||
    lowerName.includes('kebab') ||
    lowerName.includes('kabab')
  ) {
    ingredients.push({ name: 'Onion', qty: 0.05 }); // 50g per portion
    ingredients.push({ name: 'Tomato', qty: 0.05 }); // 50g
    ingredients.push({ name: 'Garlic', qty: 0.01 }); // 10g
    ingredients.push({ name: 'Ginger', qty: 0.01 }); // 10g
    ingredients.push({ name: 'Oil', qty: 0.02 });    // 20ml
  }

  // 2. Specific Items
  if (lowerName.includes('paneer')) {
    ingredients.push({ name: 'Paneer', qty: 0.15 }); // 150g
  }

  if (lowerName.includes('chicken') || lowerName.includes('murgh')) {
    ingredients.push({ name: 'Chicken', qty: 0.20 }); // 200g
  }

  if (lowerName.includes('potato') || lowerName.includes('aloo') || lowerName.includes('fries') || lowerName.includes('wedges')) {
    ingredients.push({ name: 'Potato', qty: 0.20 }); // 200g
  }

  if (lowerName.includes('rice') || lowerName.includes('biryani') || lowerName.includes('pulao')) {
    ingredients.push({ name: 'Rice', qty: 0.15 }); // 150g
  }

  if (lowerName.includes('dal') || lowerName.includes('lentil')) {
    ingredients.push({ name: 'Dal', qty: 0.10 });
    ingredients.push({ name: 'Lentils', qty: 0.10 });
  }

  if (lowerName.includes('pizza') || lowerName.includes('bread') || lowerName.includes('burger') || lowerName.includes('noodle') || lowerName.includes('pasta')) {
    ingredients.push({ name: 'Flour', qty: 0.10 });
  }

  return ingredients;
};

// Deduct stock based on order
exports.deductStockForOrder = async (orderId) => {
  const { default: Order } = await import("../models/order.js");
  const { default: MenuItem } = await import("../models/menu.js");
  const { default: InventoryItem } = await import("../models/inventory.js");

  const order = await Order.findById(orderId);
  if (!order) return;

  console.log(`Deducting stock for order ${order.orderNumber}`);

  for (const item of order.items) {
    let ingredientsToDeduct = [];
    let source = 'database'; // 'database' or 'heuristic'

    // 1. Try to find strict recipe from Database
    let menuItem = null;
    if (item.menuItemId) {
      menuItem = await MenuItem.findById(item.menuItemId);
    } else if (item.name) {
      menuItem = await MenuItem.findOne({
        name: { $regex: new RegExp(`^${item.name}$`, 'i') },
        restaurantId: order.restaurantId
      });
    }

    if (menuItem && menuItem.ingredients && menuItem.ingredients.length > 0) {
      ingredientsToDeduct = menuItem.ingredients.map(ing => ({
        itemId: ing.itemId,
        name: null,
        qty: ing.quantity
      }));
      source = 'database';
    } else {
      // 2. Fallback: Heuristic Deduction
      const inferred = inferIngredientsFromName(item.name || '');
      if (inferred.length > 0) {
        ingredientsToDeduct = inferred;
        source = 'heuristic';
      }
    }

    if (ingredientsToDeduct.length > 0) {
      console.log(`Processing deduction for ${item.name} (Source: ${source})`);

      for (const ingredient of ingredientsToDeduct) {
        const qtyUsed = ingredient.qty * item.qty;
        let inventoryItem = null;

        if (ingredient.itemId) {
          inventoryItem = await InventoryItem.findById(ingredient.itemId);
        } else if (ingredient.name) {
          // Find inventory item by name (fuzzy match)
          inventoryItem = await InventoryItem.findOne({
            name: { $regex: new RegExp(`^${ingredient.name}$`, 'i') },
            restaurantId: order.restaurantId
          });
        }

        if (inventoryItem) {
          const newStock = inventoryItem.currentStock - qtyUsed;

          await InventoryItem.findByIdAndUpdate(inventoryItem._id, {
            $inc: { currentStock: -qtyUsed }
          });

          console.log(`Deducted ${qtyUsed} ${inventoryItem.unit} of ${inventoryItem.name}. New Stock: ${newStock}`);

          if (newStock <= (inventoryItem.minStockLevel || 0)) {
            console.warn(`Low stock alert for ${inventoryItem.name}: ${newStock} left`);
          }
        } else {
          if (source === 'heuristic') {
            console.log(`Heuristic skipped: Inventory item '${ingredient.name}' not found in database.`);
          } else {
            console.warn(`Recipe ingredient missing in inventory DB (ID: ${ingredient.itemId})`);
          }
        }
      }
    } else {
      console.log(`No ingredients (recipe or basic) found for: ${item.name}`);
    }
  }
};
// end