const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const amqp = require('amqplib');

// Routes
const shippingRoutes = require('./routes/shipping.routes');

const app = express();
const PORT = process.env.PORT || 3006;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shipping_db';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';

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
    
    // Đảm bảo exchange 'shipping_events' tồn tại
    await channel.assertExchange('shipping_events', 'topic', { durable: true });
    
    // Lắng nghe order và payment events
    await channel.assertQueue('shipping_service_order_queue', { durable: true });
    await channel.bindQueue('shipping_service_order_queue', 'order_events', 'order.*');
    
    await channel.assertQueue('shipping_service_payment_queue', { durable: true });
    await channel.bindQueue('shipping_service_payment_queue', 'payment_events', 'payment.*');
    
    // Xử lý order events
    channel.consume('shipping_service_order_queue', (msg) => {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      
      console.log(`Nhận message với routing key: ${routingKey}`);
      
      // Xử lý message dựa trên routing key
      if (routingKey === 'order.created') {
        console.log('Đơn hàng mới được tạo, chuẩn bị thông tin vận chuyển:', content.order._id);
        // Implement logic to prepare shipping information
      }
      
      channel.ack(msg);
    });
    
    // Xử lý payment events
    channel.consume('shipping_service_payment_queue', (msg) => {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      
      console.log(`Nhận message với routing key: ${routingKey}`);
      
      // Xử lý message dựa trên routing key
      if (routingKey === 'payment.completed') {
        console.log('Thanh toán hoàn tất, chuẩn bị giao hàng:', content.payment.orderId);
        // Implement logic to start shipping process
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
    channel.publish('shipping_events', routingKey, Buffer.from(JSON.stringify(message)));
    console.log(`Đã gửi message đến ${routingKey}`);
  }
}

// Lưu các biến toàn cục để sử dụng trong controller
app.set('orderServiceUrl', ORDER_SERVICE_URL);
app.set('publishToRabbitMQ', publishToRabbitMQ);

// Routes
app.use('/shipping', shippingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Shipping Service đang hoạt động' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Có lỗi xảy ra!' });
});

app.listen(PORT, () => {
  console.log(`Shipping Service đang chạy tại cổng ${PORT}`);
});