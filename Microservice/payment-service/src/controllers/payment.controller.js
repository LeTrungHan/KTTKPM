const axios = require('axios');
const Payment = require('../models/payment.model');
const paymentService = require('../services/payment.service');
const { createCircuitBreaker } = require('../utils/circuit-breaker');
const { retryOperation } = require('../utils/retry');

// Tạo circuit breaker cho gọi đến Order Service
const orderServiceBreaker = createCircuitBreaker(
  async (orderId) => {
    const ORDER_SERVICE_URL = global.app.get('orderServiceUrl');
    return await axios.get(`${ORDER_SERVICE_URL}/orders/${orderId}`);
  },
  {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000
  }
);

// Tạo payment request
exports.createPayment = async (req, res) => {
  try {
    const { orderId, amount, method, paymentDetails } = req.body;
    
    // Kiểm tra order có tồn tại không sử dụng circuit breaker và retry
    try {
      await retryOperation(async () => {
        const response = await orderServiceBreaker.fire(orderId);
        const order = response.data;
        
        if (order.status === 'CANCELLED') {
          throw new Error('Không thể tạo payment cho đơn hàng đã hủy');
        }
      });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Lỗi khi xác thực đơn hàng' });
    }
    
    // Tạo payment
    const payment = await paymentService.createPayment({
      orderId,
      amount,
      method,
      status: 'PENDING',
      paymentDetails
    });
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('payment.created', { payment });
    
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật trạng thái thanh toán
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, transactionId } = req.body;
    const payment = await paymentService.updatePaymentStatus(req.params.id, status, transactionId);
    
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('payment.updated', { payment });
    
    // Nếu thanh toán hoàn tất, cập nhật status của đơn hàng
    if (status === 'COMPLETED') {
      try {
        await retryOperation(async () => {
          const ORDER_SERVICE_URL = req.app.get('orderServiceUrl');
          await axios.patch(`${ORDER_SERVICE_URL}/orders/${payment.orderId}/status`, {
            status: 'PROCESSING'
          });
        });
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error.message);
        // Không trả về lỗi cho client vì việc thanh toán đã hoàn tất
      }
    }
    
    res.status(200).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy thông tin thanh toán theo ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thanh toán theo orderId
exports.getPaymentByOrderId = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentByOrderId(req.params.orderId);
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán cho đơn hàng này' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hoàn tiền
exports.refundPayment = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán' });
    }
    
    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Chỉ có thể hoàn tiền cho thanh toán đã hoàn tất' });
    }
    
    // Xử lý hoàn tiền (mô phỏng)
    const refundedPayment = await paymentService.updatePaymentStatus(req.params.id, 'REFUNDED');
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('payment.refunded', { payment: refundedPayment });
    
    res.status(200).json(refundedPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
