const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware xác thực (có thể bỏ comment nếu cần)
// router.use(authMiddleware);

// Tất cả các request đến /api/shipping sẽ được chuyển tiếp đến Shipping Service
const shippingServiceProxy = createProxyMiddleware({
  target: process.env.SHIPPING_SERVICE_URL || 'http://localhost:3006',
  changeOrigin: true,
  pathRewrite: {
    '^/api/shipping': '/shipping',
  },
});

router.use('/', shippingServiceProxy);

module.exports = router;