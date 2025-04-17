const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');

// Tạo inventory mới
router.post('/', inventoryController.createInventory);

// Lấy tất cả inventory
router.get('/', inventoryController.getAllInventories);

// Lấy inventory theo ID
router.get('/:id', inventoryController.getInventoryById);

// Lấy inventory theo productId
router.get('/product/:productId', inventoryController.getInventoryByProductId);

// Cập nhật số lượng inventory
router.patch('/:id/quantity', inventoryController.updateInventoryQuantity);

// Đặt trước số lượng sản phẩm (reserve)
router.post('/reserve', inventoryController.reserveInventory);

// Giải phóng số lượng đã đặt trước (release)
router.post('/release', inventoryController.releaseInventory);

// Kiểm tra tồn kho thấp
router.get('/check/low-stock', inventoryController.checkLowStock);

module.exports = router;