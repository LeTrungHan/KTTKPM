const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

// Tạo khách hàng mới
router.post('/', customerController.createCustomer);

// Lấy tất cả khách hàng
router.get('/', customerController.getAllCustomers);

// Lấy khách hàng theo ID
router.get('/:id', customerController.getCustomerById);

// Cập nhật khách hàng
router.put('/:id', customerController.updateCustomer);

// Xóa khách hàng
router.delete('/:id', customerController.deleteCustomer);

// Thêm địa chỉ mới
router.post('/:id/addresses', customerController.addAddress);

// Đặt địa chỉ mặc định
router.patch('/:id/default-address', customerController.setDefaultAddress);

module.exports = router;