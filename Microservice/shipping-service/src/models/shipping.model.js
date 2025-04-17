const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  description: {
    type: String
  }
});

const shippingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Order'
  },
  trackingNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  carrier: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED'],
    default: 'PENDING'
  },
  estimatedDelivery: {
    type: Date
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'Vietnam' }
  },
  trackingHistory: [trackingSchema],
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
shippingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Shipping = mongoose.model('Shipping', shippingSchema);

module.exports = Shipping;