const CircuitBreaker = require('opossum');

/**
 * Tạo một circuit breaker cho các service calls
 * @param {Function} fn - Hàm cần được bảo vệ bởi circuit breaker
 * @param {Object} options - Các option cho circuit breaker
 * @returns {CircuitBreaker} - Instance của CircuitBreaker
 */
function createCircuitBreaker(fn, options = {}) {
  const defaultOptions = {
    timeout: 5000, // Thời gian chờ trước khi timeout (5 giây)
    errorThresholdPercentage: 50, // Ngưỡng % lỗi để circuit mở (50%)
    resetTimeout: 10000, // Thời gian chờ trước khi thử lại (10 giây)
    rollingCountTimeout: 60000, // Cửa sổ thời gian để tính tỷ lệ lỗi (60 giây)
    rollingCountBuckets: 10, // Số bucket để theo dõi lỗi
    fallback: (error) => {
      console.error('Circuit Breaker fallback triggered:', error.message);
      throw new Error('Service temporarily unavailable. Please try again later.');
    }
  };

  const circuitBreakerOptions = { ...defaultOptions, ...options };
  const breaker = new CircuitBreaker(fn, circuitBreakerOptions);

  // Event listeners
  breaker.on('open', () => {
    console.log('Circuit Breaker opened');
  });

  breaker.on('close', () => {
    console.log('Circuit Breaker closed');
  });

  breaker.on('halfOpen', () => {
    console.log('Circuit Breaker half-open');
  });

  breaker.on('fallback', (data) => {
    console.log('Circuit Breaker fallback called for:', data);
  });

  return breaker;
}

module.exports = { createCircuitBreaker };