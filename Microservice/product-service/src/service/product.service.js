const Product = require('../models/product.model');

// Tạo sản phẩm mới
exports.createProduct = async (productData) => {
  const product = new Product(productData);
  return await product.save();
};

// Lấy tất cả sản phẩm
exports.getAllProducts = async () => {
  return await Product.find();
};

// Lấy sản phẩm theo ID
exports.getProductById = async (id) => {
  return await Product.findById(id);
};

// Cập nhật sản phẩm
exports.updateProduct = async (id, productData) => {
  return await Product.findByIdAndUpdate(id, productData, { new: true });
};

// Xóa sản phẩm
exports.deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};

// Cập nhật số lượng sản phẩm
exports.updateProductStock = async (productId, quantityChange) => {
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Không tìm thấy sản phẩm');
  }
  
  // Đảm bảo số lượng không âm
  const newQuantity = product.quantity - quantityChange;
  
  if (newQuantity < 0) {
    throw new Error('Không đủ số lượng sản phẩm trong kho');
  }
  
  product.quantity = newQuantity;
  return await product.save();
};