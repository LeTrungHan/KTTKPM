const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// Tạo sản phẩm mới (Create)
router.post('/', productController.createProduct);

// Lấy tất cả sản phẩm (Read all)
router.get('/', productController.getAllProducts);

// Lấy một sản phẩm theo ID (Read one)
router.get('/:id', productController.getProductById);

// Cập nhật sản phẩm (Update)
router.put('/:id', productController.updateProduct);

// Xóa sản phẩm (Delete)
router.delete('/:id', productController.deleteProduct);

// Cập nhật số lượng sản phẩm (thường được gọi từ Order Service)
router.patch('/stock', productController.updateProductStock);

module.exports = router;