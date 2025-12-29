import mongoose from "mongoose";//new

const purchaseOrderItemSchema = new mongoose.Schema({
    inventoryItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0.01
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
});

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    items: [purchaseOrderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'ordered', 'received', 'cancelled'],
        default: 'draft'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    receivedDate: {
        type: Date
    },
    notes: {
        type: String
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    }
}, {
    timestamps: true
});

purchaseOrderSchema.index({ restaurantId: 1, poNumber: 1 }, { unique: true });

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);
