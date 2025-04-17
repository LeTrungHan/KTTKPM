const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0
  },
  warehouseLocation: {
    type: String,
    required: true
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Cập nhật updatedAt trước khi save
inventorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual getter cho số lượng có sẵn (available quantity)
inventorySchema.virtual('availableQuantity').get(function() {
  return Math.max(0, this.quantity - this.reservedQuantity);
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
