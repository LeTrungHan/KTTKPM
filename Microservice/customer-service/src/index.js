const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const amqp = require('amqplib');

// Routes
const customerRoutes = require('./routes/customer.routes');

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/customer_db';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

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
    
    // Đảm bảo exchange 'customer_events' tồn tại
    await channel.assertExchange('customer_events', 'topic', { durable: true });
    
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
    channel.publish('customer_events', routingKey, Buffer.from(JSON.stringify(message)));
    console.log(`Đã gửi message đến ${routingKey}`);
  }
}

// Lưu function publishToRabbitMQ để sử dụng trong controller
app.set('publishToRabbitMQ', publishToRabbitMQ);

// Routes
app.use('/customers', customerRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Customer Service đang hoạt động' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Có lỗi xảy ra!' });
});

app.listen(PORT, () => {
  console.log(`Customer Service đang chạy tại cổng ${PORT}`);
});