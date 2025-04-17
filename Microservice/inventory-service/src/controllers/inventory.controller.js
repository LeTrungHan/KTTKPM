exports.getInventoryByProductId = async (req, res) => {
    try {
      const inventory = await inventoryService.getInventoryByProductId(req.params.productId);
      if (!inventory) {
        return res.status(404).json({ message: 'Không tìm thấy inventory cho sản phẩm này' });
      }
      res.status(200).json(inventory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Đặt trước số lượng sản phẩm (reserve)
  exports.reserveInventory = async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      
      // Kiểm tra và đặt trước số lượng
      const inventory = await inventoryService.reserveInventory(productId, quantity);
      
      // Publish event đến RabbitMQ
      const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
      publishToRabbitMQ('inventory.reserved', { 
        productId, 
        quantity, 
        availableQuantity: inventory.availableQuantity 
      });
      
      res.status(200).json(inventory);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  // Giải phóng số lượng đã đặt trước (release)
  exports.releaseInventory = async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      
      // Giải phóng số lượng đã đặt trước
      const inventory = await inventoryService.releaseInventory(productId, quantity);
      
      // Publish event đến RabbitMQ
      const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
      publishToRabbitMQ('inventory.released', { 
        productId, 
        quantity, 
        availableQuantity: inventory.availableQuantity 
      });
      
      res.status(200).json(inventory);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  // Lấy tất cả inventory
  exports.getAllInventories = async (req, res) => {
    try {
      const inventories = await inventoryService.getAllInventories();
      res.status(200).json(inventories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Kiểm tra tồn kho thấp
  exports.checkLowStock = async (req, res) => {
    try {
      const threshold = req.query.threshold || 10; // Ngưỡng mặc định là 10
      const lowStockItems = await inventoryService.getLowStockItems(threshold);
      res.status(200).json(lowStockItems);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };