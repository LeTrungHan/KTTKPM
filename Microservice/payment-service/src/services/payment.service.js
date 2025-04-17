const Payment = require('../models/payment.model');

// Tạo payment mới
exports.createPayment = async (paymentData) => {
  const payment = new Payment(paymentData);
  return await payment.save();
};

// Lấy payment theo ID
exports.getPaymentById = async (id) => {
  return await Payment.findById(id);
};

// Lấy payment theo orderId
exports.getPaymentByOrderId = async (orderId) => {
  return await Payment.findOne({ orderId });
};

// Cập nhật trạng thái payment
exports.updatePaymentStatus = async (id, status, transactionId = null) => {
  const updateData = { status, updatedAt: Date.now() };
  
  if (transactionId) {
    updateData.transactionId = transactionId;
  }
  
  return await Payment.findByIdAndUpdate(id, updateData, { new: true });
};

// Lấy tất cả payment
exports.getAllPayments = async () => {
  return await Payment.find();
};
