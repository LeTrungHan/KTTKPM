const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware xác thực (có thể bỏ comment nếu cần)
// router.use(authMiddleware);

// Tất cả các request đến /api/products sẽ được chuyển tiếp đến Product Service
const productServiceProxy = createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/products',
  },
});

router.use('/', productServiceProxy);

module.exports = router;