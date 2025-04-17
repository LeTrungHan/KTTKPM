const Inventory = require('../models/inventory.model');

// Tạo inventory mới
exports.createInventory = async (inventoryData) => {
  const inventory = new Inventory(inventoryData);
  return await inventory.save();
};

// Lấy inventory theo ID
exports.getInventoryById = async (id) => {
  return await Inventory.findById(id);
};

// Lấy inventory theo productId
exports.getInventoryByProductId = async (productId) => {
  return await Inventory.findOne({ productId });
};

// Cập nhật số lượng inventory
exports.updateInventoryQuantity = async (id, quantity) => {
  return await Inventory.findByIdAndUpdate(
    id,
    { 
      quantity, 
      lastRestocked: Date.now(),
      updatedAt: Date.now() 
    },
    { new: true }
  );
};

// Đặt trước số lượng sản phẩm (reserve)
exports.reserveInventory = async (productId, quantity) => {
  const inventory = await Inventory.findOne({ productId });
  
  if (!inventory) {
    throw new Error('Không tìm thấy inventory cho sản phẩm này');
  }
  
  // Kiểm tra xem có đủ số lượng không
  if (inventory.availableQuantity < quantity) {
    throw new Error('Không đủ số lượng tồn kho');
  }
  
  // Cập nhật số lượng đã đặt trước
  inventory.reservedQuantity += quantity;
  inventory.updatedAt = Date.now();
  
  return await inventory.save();
};

// Giải phóng số lượng đã đặt trước (release)
exports.releaseInventory = async (productId, quantity) => {
  const inventory = await Inventory.findOne({ productId });
  
  if (!inventory) {
    throw new Error('Không tìm thấy inventory cho sản phẩm này');
  }
  
  // Đảm bảo số lượng release không vượt quá số lượng đã reserve
  const releaseQuantity = Math.min(quantity, inventory.reservedQuantity);
  
  // Cập nhật số lượng đã đặt trước
  inventory.reservedQuantity -= releaseQuantity;
  inventory.updatedAt = Date.now();
  
  return await inventory.save();
};

// Lấy tất cả inventory
exports.getAllInventories = async () => {
  return await Inventory.find();
};

// Lấy danh sách inventory có tồn kho thấp
exports.getLowStockItems = async (threshold) => {
  return await Inventory.find({ quantity: { $lte: threshold } });
};

// Giảm số lượng tồn kho khi đơn hàng được tạo
exports.reduceInventoryQuantity = async (productId, quantity) => {
  const inventory = await Inventory.findOne({ productId });
  
  if (!inventory) {
    throw new Error('Không tìm thấy inventory cho sản phẩm này');
  }
  
  if (inventory.quantity < quantity) {
    throw new Error('Không đủ số lượng tồn kho');
  }
  
  inventory.quantity -= quantity;
  inventory.updatedAt = Date.now();
  
  return await inventory.save();
};

// Tăng số lượng tồn kho khi đơn hàng bị hủy
exports.increaseInventoryQuantity = async (productId, quantity) => {
  const inventory = await Inventory.findOne({ productId });
  
  if (!inventory) {
    throw new Error('Không tìm thấy inventory cho sản phẩm này');
  }
  
  inventory.quantity += quantity;
  inventory.updatedAt = Date.now();
  
  return await inventory.save();
};