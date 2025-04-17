const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Tạo payment request
router.post('/', paymentController.createPayment);

// Lấy payment theo ID
router.get('/:id', paymentController.getPaymentById);

// Lấy payment theo orderId
router.get('/order/:orderId', paymentController.getPaymentByOrderId);

// Cập nhật trạng thái payment
router.patch('/:id/status', paymentController.updatePaymentStatus);

// Hoàn tiền
router.post('/:id/refund', paymentController.refundPayment);

module.exports = router;
