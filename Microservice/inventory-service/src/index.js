const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const amqp = require('amqplib');

// Routes
const inventoryRoutes = require('./routes/inventory.routes');

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_db';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Đã kết nối đến MongoDB'))
  .catch(err => console.error('Không thể kết nối đến MongoDB:', err));

// Kết nối RabbitMQ
let channel;
async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Đảm bảo exchange 'inventory_events' tồn tại
    await channel.assertExchange('inventory_events', 'topic', { durable: true });
    
    // Lắng nghe order events
    await channel.assertQueue('inventory_service_order_queue', { durable: true });
    await channel.bindQueue('inventory_service_order_queue', 'order_events', 'order.*');
    
    // Lắng nghe product events
    await channel.assertQueue('inventory_service_product_queue', { durable: true });
    await channel.bindQueue('inventory_service_product_queue', 'product_events', 'product.*');
    
    // Xử lý order events
    channel.consume('inventory_service_order_queue', (msg) => {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      
      console.log(`Nhận message với routing key: ${routingKey}`);
      
      // Xử lý message dựa trên routing key
      if (routingKey === 'order.created') {
        // Xử lý đặt hàng: cập nhật số lượng tồn kho
        console.log('Đơn hàng mới được tạo, cập nhật số lượng tồn kho:', content.order._id);
        
        // Implement logic to update inventory
      } else if (routingKey === 'order.cancelled') {
        // Hoàn lại số lượng sản phẩm khi đơn hàng bị hủy
        console.log('Đơn hàng bị hủy, hoàn lại số lượng tồn kho:', content.order._id);
        
        // Implement logic to restore inventory
      }
      
      channel.ack(msg);
    });
    
    // Xử lý product events
    channel.consume('inventory_service_product_queue', (msg) => {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      
      console.log(`Nhận message với routing key: ${routingKey}`);
      
      // Xử lý message dựa trên routing key
      if (routingKey === 'product.created') {
        // Tạo inventory record cho sản phẩm mới
console.log('Sản phẩm mới được tạo, khởi tạo inventory:', content.product._id);
        
        // Implement logic to create inventory
      }
      
      channel.ack(msg);
    });
    
    console.log('Đã kết nối đến RabbitMQ');
  } catch (error) {
    console.error('Lỗi kết nối đến RabbitMQ:', error);
    setTimeout(connectToRabbitMQ, 5000); // Thử kết nối lại sau 5s
  }
}
connectToRabbitMQ();

// Function để publish message đến RabbitMQ
function publishToRabbitMQ(routingKey, message) {
  if (channel) {
    channel.publish('inventory_events', routingKey, Buffer.from(JSON.stringify(message)));
    console.log(`Đã gửi message đến ${routingKey}`);
  }
}

// Lưu các biến toàn cục để sử dụng trong controller
app.set('productServiceUrl', PRODUCT_SERVICE_URL);
app.set('publishToRabbitMQ', publishToRabbitMQ);

// Routes
app.use('/inventory', inventoryRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Inventory Service đang hoạt động' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Có lỗi xảy ra!' });
});

app.listen(PORT, () => {
  console.log(`Inventory Service đang chạy tại cổng ${PORT}`);
});