const axios = require('axios');
const Order = require('../models/order.model');
const orderService = require('../services/order.service');

// Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
  try {
    // Lấy thông tin từ request
    const { customerId, items, shippingAddress, paymentMethod } = req.body;
    
    const PRODUCT_SERVICE_URL = req.app.get('productServiceUrl');
    const CUSTOMER_SERVICE_URL = req.app.get('customerServiceUrl');
    
    // Kiểm tra khách hàng tồn tại
    try {
      await axios.get(`${CUSTOMER_SERVICE_URL}/customers/${customerId}`);
    } catch (error) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }
    
    // Kiểm tra và cập nhật số lượng sản phẩm
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      try {
        // Lấy thông tin sản phẩm
        const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${item.productId}`);
        const product = productResponse.data;
        
        // Kiểm tra số lượng tồn kho
        if (product.quantity < item.quantity) {
          return res.status(400).json({ message: `Không đủ hàng trong kho cho sản phẩm: ${product.name}` });
        }
        
        // Cập nhật số lượng sản phẩm
        await axios.patch(`${PRODUCT_SERVICE_URL}/products/stock`, {
          productId: item.productId,
          quantity: item.quantity
        });
        
        // Thêm vào danh sách sản phẩm đơn hàng
        orderItems.push({
          productId: item.productId,
          name: product.name,
          price: product.price,
          quantity: item.quantity
        });
        
        // Tính tổng tiền
        totalAmount += product.price * item.quantity;
      } catch (error) {
        return res.status(404).json({ message: `Không tìm thấy sản phẩm có ID ${item.productId}` });
      }
    }
    
    // Tạo đơn hàng
    const orderData = {
      customerId,
      items: orderItems,
      totalAmount,
      status: 'PENDING',
      shippingAddress,
      paymentMethod
    };
    
    const order = await orderService.createOrder(orderData);
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('order.created', { order });
    
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy tất cả đơn hàng
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy đơn hàng theo ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy đơn hàng theo customerId
exports.getOrdersByCustomerId = async (req, res) => {
  try {
    const orders = await orderService.getOrdersByCustomerId(req.params.customerId);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('order.updated', { order });
    
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Hủy đơn hàng
exports.cancelOrder = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Kiểm tra trạng thái đơn hàng
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      return res.status(400).json({ message: 'Không thể hủy đơn hàng đã được giao hoặc đang vận chuyển' });
    }
    
    // Cập nhật trạng thái đơn hàng thành CANCELLED
    const cancelledOrder = await orderService.updateOrderStatus(req.params.id, 'CANCELLED');
    
    // Hoàn lại số lượng sản phẩm vào kho
    const PRODUCT_SERVICE_URL = req.app.get('productServiceUrl');
    
    for (const item of order.items) {
      try {
        // Trả lại số lượng sản phẩm vào kho (quantity âm để tăng số lượng trong kho)
        await axios.patch(`${PRODUCT_SERVICE_URL}/products/stock`, {
          productId: item.productId,
          quantity: -item.quantity // Dấu - để tăng số lượng trong kho
        });
      } catch (error) {
        console.error(`Lỗi khi hoàn trả số lượng sản phẩm ${item.productId}:`, error.message);
      }
    }
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('order.cancelled', { order: cancelledOrder });
    
    res.status(200).json(cancelledOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};