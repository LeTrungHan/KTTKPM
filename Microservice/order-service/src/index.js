const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const amqp = require('amqplib');
const axios = require('axios');

// Routes
const orderRoutes = require('./routes/order.routes');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/order_db';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';
const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3003';

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
    
    // Đảm bảo exchange 'order_events' tồn tại
    await channel.assertExchange('order_events', 'topic', { durable: true });
    
    // Lắng nghe product events
    await channel.assertQueue('order_service_product_queue', { durable: true });
    await channel.bindQueue('order_service_product_queue', 'product_events', 'product.*');
    
    channel.consume('order_service_product_queue', (msg) => {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      
      console.log(`Nhận message với routing key: ${routingKey}`);
      console.log('Nội dung message:', content);
      
      // Xử lý message dựa trên routing key
      if (routingKey === 'product.stock.updated') {
        // Xử lý khi số lượng sản phẩm được cập nhật
        console.log('Số lượng sản phẩm được cập nhật:', content.product);
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
    channel.publish('order_events', routingKey, Buffer.from(JSON.stringify(message)));
    console.log(`Đã gửi message đến ${routingKey}`);
  }
}

// Lưu các URLs và function publishToRabbitMQ để sử dụng trong controller
app.set('productServiceUrl', PRODUCT_SERVICE_URL);
app.set('customerServiceUrl', CUSTOMER_SERVICE_URL);
app.set('publishToRabbitMQ', publishToRabbitMQ);

// Routes
app.use('/orders', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Order Service đang hoạt động' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Có lỗi xảy ra!' });
});

app.listen(PORT, ()=>{
    console.log(`Order Service đang chạy tại cổng ${PORT}`);
});