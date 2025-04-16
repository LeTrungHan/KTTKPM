const Product = require('../models/product.model');
const productService = require('../services/product.service');

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('product.created', { product });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy một sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('product.updated', { product });
    
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('product.deleted', { productId: req.params.id });
    
    res.status(200).json({ message: 'Đã xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật số lượng sản phẩm
exports.updateProductStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await productService.updateProductStock(productId, quantity);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('product.stock.updated', { product });
    
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};