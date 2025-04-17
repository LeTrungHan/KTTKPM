const axios = require('axios');
const Shipping = require('../models/shipping.model');
const shippingService = require('../services/shipping.service');
const { createCircuitBreaker } = require('../utils/circuit-breaker');
const { createTimeLimiter } = require('../utils/time-limiter');

// Tạo circuit breaker cho gọi đến Order Service
const orderServiceBreaker = createCircuitBreaker(
  async (orderId) => {
    const ORDER_SERVICE_URL = global.app.get('orderServiceUrl');
    return await axios.get(`${ORDER_SERVICE_URL}/orders/${orderId}`);
  },
  {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000
  }
);

// Tạo time limiter cho các external API calls
const externalServiceTimeLimiter = createTimeLimiter(
  async (fn) => await fn(),
  5000, 
  'External service request timed out'
);

// Tạo thông tin vận chuyển mới
exports.createShipping = async (req, res) => {
  try {
    const { orderId, carrier, shippingAddress } = req.body;
    
    // Kiểm tra order có tồn tại không sử dụng circuit breaker và time limiter
    try {
      await externalServiceTimeLimiter(async () => {
        const response = await orderServiceBreaker.fire(orderId);
        const order = response.data;
        
        if (order.status === 'CANCELLED') {
          throw new Error('Không thể tạo shipping cho đơn hàng đã hủy');
        }
      });
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Lỗi khi xác thực đơn hàng' });
    }
    
    // Tạo shipping mới
    const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3); // Dự kiến giao sau 3 ngày
    
    const shippingData = {
      orderId,
      trackingNumber,
      carrier,
      status: 'PENDING',
      estimatedDelivery,
      shippingAddress,
      trackingHistory: [
        {
          status: 'PENDING',
          description: 'Đơn hàng đã được tạo và đang chờ xử lý'
        }
      ]
    };
    
    const shipping = await shippingService.createShipping(shippingData);
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('shipping.created', { shipping });
    
    res.status(201).json(shipping);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật trạng thái vận chuyển
exports.updateShippingStatus = async (req, res) => {
  try {
    const { status, location, description } = req.body;
    
    // Cập nhật trạng thái và thêm vào lịch sử theo dõi
    const shipping = await shippingService.updateShippingStatus(
      req.params.id, 
      status, 
      location, 
      description
    );
    
    if (!shipping) {
return res.status(404).json({ message: 'Không tìm thấy thông tin vận chuyển' });
    }
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('shipping.updated', { shipping });
    
    // Nếu trạng thái là DELIVERED, cập nhật status của đơn hàng
    if (status === 'DELIVERED') {
      try {
        await externalServiceTimeLimiter(async () => {
          const ORDER_SERVICE_URL = req.app.get('orderServiceUrl');
          await axios.patch(`${ORDER_SERVICE_URL}/orders/${shipping.orderId}/status`, {
            status: 'DELIVERED'
          });
        });
      } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error.message);
        // Không trả về lỗi cho client vì việc cập nhật shipping đã hoàn tất
      }
    }
    
    res.status(200).json(shipping);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy thông tin vận chuyển theo ID
exports.getShippingById = async (req, res) => {
  try {
    const shipping = await shippingService.getShippingById(req.params.id);
    if (!shipping) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin vận chuyển' });
    }
    res.status(200).json(shipping);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin vận chuyển theo orderId
exports.getShippingByOrderId = async (req, res) => {
  try {
    const shipping = await shippingService.getShippingByOrderId(req.params.orderId);
    if (!shipping) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin vận chuyển cho đơn hàng này' });
    }
    res.status(200).json(shipping);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin vận chuyển theo tracking number
exports.getShippingByTrackingNumber = async (req, res) => {
  try {
    const shipping = await shippingService.getShippingByTrackingNumber(req.params.trackingNumber);
    if (!shipping) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin vận chuyển với mã theo dõi này' });
    }
    res.status(200).json(shipping);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hủy vận chuyển
exports.cancelShipping = async (req, res) => {
  try {
    const shipping = await shippingService.getShippingById(req.params.id);
    
    if (!shipping) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin vận chuyển' });
    }
    
    if (['DELIVERED', 'RETURNED'].includes(shipping.status)) {
      return res.status(400).json({ message: 'Không thể hủy vận chuyển đã hoàn tất hoặc đã trả lại' });
    }
    
    // Cập nhật trạng thái và thêm vào lịch sử theo dõi
    const cancelledShipping = await shippingService.updateShippingStatus(req.params.id,
        'RETURNED',
        null,
        'Đơn hàng đã bị hủy và đang được trả lại'
      );
      
      // Publish event đến RabbitMQ
      const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
      publishToRabbitMQ('shipping.cancelled', { shipping: cancelledShipping });
      
      res.status(200).json(cancelledShipping);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  // Lấy tất cả các shipping
  exports.getAllShippings = async (req, res) => {
    try {
      const shippings = await shippingService.getAllShippings();
      res.status(200).json(shippings);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };