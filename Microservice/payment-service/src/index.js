const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const amqp = require('amqplib');
const { createRateLimiter } = require('./utils/rate-limiter');

// Routes
const paymentRoutes = require('./routes/payment.routes');

const app = express();
const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/payment_db';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';

// Middleware
app.use(cors());
app.use(express.json());

// Apply rate limiter to all requests
app.use(createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

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
    
    // Đảm bảo exchange 'payment_events' tồn tại
    await channel.assertExchange('payment_events', 'topic', { durable: true });
    
    // Lắng nghe order events
    await channel.assertQueue('payment_service_order_queue', { durable: true });
    await channel.bindQueue('payment_service_order_queue', 'order_events', 'order.*');
    
    channel.consume('payment_service_order_queue', (msg) => {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      
      console.log(`Nhận message với routing key: ${routingKey}`);
      console.log('Nội dung message:', content);
      
      // Xử lý message dựa trên routing key
      if (routingKey === 'order.created') {
        // Tạo payment request khi order được tạo
        // Implement logic here
        console.log('Nhận thông báo order mới, chuẩn bị xử lý thanh toán:', content.order._id);
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
    channel.publish('payment_events', routingKey, Buffer.from(JSON.stringify(message)));
    console.log(`Đã gửi message đến ${routingKey}`);
  }
}

// Lưu các biến toàn cục để sử dụng trong controller
app.set('orderServiceUrl', ORDER_SERVICE_URL);
app.set('publishToRabbitMQ', publishToRabbitMQ);

// Routes
app.use('/payments', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Payment Service đang hoạt động' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Có lỗi xảy ra!' });
});

app.listen(PORT, () => {
  console.log(`Payment Service đang chạy tại cổng ${PORT}`);
});
