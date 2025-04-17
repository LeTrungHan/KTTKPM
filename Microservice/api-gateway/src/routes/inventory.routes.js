const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('../middleware/auth.middleware');


// Tất cả các request đến /api/inventory sẽ được chuyển tiếp đến Inventory Service
const inventoryServiceProxy = createProxyMiddleware({
  target: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/inventory': '/inventory',
  },
});

router.use('/', inventoryServiceProxy);

module.exports = router;