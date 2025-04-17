const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('../middleware/auth.middleware');


// Tất cả các request đến /api/payments sẽ được chuyển tiếp đến Payment Service
const paymentServiceProxy = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '/payments',
  },
});

router.use('/', paymentServiceProxy);

module.exports = router;