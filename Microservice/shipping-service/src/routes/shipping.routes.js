const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shipping.controller');

// Tạo shipping mới
router.post('/', shippingController.createShipping);

// Lấy tất cả shipping
router.get('/', shippingController.getAllShippings);

// Lấy shipping theo ID
router.get('/:id', shippingController.getShippingById);

// Lấy shipping theo orderId
router.get('/order/:orderId', shippingController.getShippingByOrderId);

// Lấy shipping theo tracking number
router.get('/tracking/:trackingNumber', shippingController.getShippingByTrackingNumber);

// Cập nhật trạng thái shipping
router.patch('/:id/status', shippingController.updateShippingStatus);

// Hủy shipping
router.post('/:id/cancel', shippingController.cancelShipping);

module.exports = router;