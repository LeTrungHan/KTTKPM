const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Routes
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const customerRoutes = require('./routes/customer.routes');

// Middleware
const authMiddleware = require('./middleware/auth.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Cấu hình proxy middleware
const productServiceProxy = createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/products',
  },
});

const orderServiceProxy = createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/orders',
  },
});

const customerServiceProxy = createProxyMiddleware({
  target: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/customers': '/customers',
  },
});

// Routes
app.use('/api/products', productServiceProxy);
app.use('/api/orders', orderServiceProxy);
app.use('/api/customers', customerServiceProxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway đang hoạt động' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Có lỗi xảy ra!' });
});

app.listen(PORT, () => {
  console.log(`API Gateway đang chạy tại cổng ${PORT}`);
});