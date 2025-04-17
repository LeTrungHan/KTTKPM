const Shipping = require('../models/shipping.model');

// Tạo shipping mới
exports.createShipping = async (shippingData) => {
  const shipping = new Shipping(shippingData);
  return await shipping.save();
};

// Lấy shipping theo ID
exports.getShippingById = async (id) => {
  return await Shipping.findById(id);
};

// Lấy shipping theo orderId
exports.getShippingByOrderId = async (orderId) => {
  return await Shipping.findOne({ orderId });
};

// Lấy shipping theo tracking number
exports.getShippingByTrackingNumber = async (trackingNumber) => {
  return await Shipping.findOne({ trackingNumber });
};

// Cập nhật trạng thái shipping và thêm vào lịch sử theo dõi
exports.updateShippingStatus = async (id, status, location = null, description = null) => {
  const shipping = await Shipping.findById(id);
  
  if (!shipping) {
    return null;
  }
  
  // Thêm vào lịch sử theo dõi
  shipping.trackingHistory.push({
    status,
    location,
    description,
    timestamp: Date.now()
  });
  
  // Cập nhật trạng thái hiện tại
  shipping.status = status;
  shipping.updatedAt = Date.now();
  
  return await shipping.save();
};

// Lấy tất cả shipping
exports.getAllShippings = async () => {
  return await Shipping.find();
};