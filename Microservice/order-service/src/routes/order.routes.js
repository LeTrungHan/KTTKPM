const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// Tạo đơn hàng mới
router.post('/', orderController.createOrder);

// Lấy tất cả đơn hàng
router.get('/', orderController.getAllOrders);

// Lấy đơn hàng theo ID
router.get('/:id', orderController.getOrderById);

// Lấy đơn hàng theo customerId
router.get('/customer/:customerId', orderController.getOrdersByCustomerId);

// Cập nhật trạng thái đơn hàng
router.patch('/:id/status', orderController.updateOrderStatus);

// Hủy đơn hàng
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;