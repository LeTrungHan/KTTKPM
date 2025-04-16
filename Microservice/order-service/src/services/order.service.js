const Order = require('../models/order.model');

// Tạo đơn hàng mới
exports.createOrder = async (orderData) => {
  const order = new Order(orderData);
  return await order.save();
};

// Lấy tất cả đơn hàng
exports.getAllOrders = async () => {
  return await Order.find();
};

// Lấy đơn hàng theo ID
exports.getOrderById = async (id) => {
  return await Order.findById(id);
};

// Lấy đơn hàng theo customerId
exports.getOrdersByCustomerId = async (customerId) => {
  return await Order.find({ customerId });
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (id, status) => {
  return await Order.findByIdAndUpdate(
    id,
    { status, updatedAt: Date.now() },
    { new: true }
  );
};