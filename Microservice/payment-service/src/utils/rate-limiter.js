const rateLimit = require('express-rate-limit');

/**
 * Tạo middleware giới hạn tốc độ request
 * @param {Object} options - Các option cho rate limiter
 * @returns {Function} - Middleware express rate limiter
 */
function createRateLimiter(options = {}) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Giới hạn mỗi IP chỉ được gọi tối đa 100 requests trong 15 phút
    standardHeaders: true, // Gửi `RateLimit-*` headers
    legacyHeaders: false, // Không gửi `X-RateLimit-*` headers
    message: 'Quá nhiều yêu cầu từ địa chỉ IP này, vui lòng thử lại sau 15 phút',
    skipSuccessfulRequests: false, // Không bỏ qua các request thành công
    skipFailedRequests: false, // Không bỏ qua các request thất bại
    handler: (req, res, next, options) => {
      console.log(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(options.statusCode).send(options.message);
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
}

module.exports = { createRateLimiter };
