const pTimeout = require('p-timeout');

/**
 * Tạo time limiter cho các hàm bất đồng bộ
 * @param {Function} fn - Hàm cần giới hạn thời gian
 * @param {number} milliseconds - Số mili giây tối đa cho phép
 * @param {string} message - Thông báo lỗi khi timeout
 * @returns {Promise} - Kết quả của hàm hoặc lỗi nếu timeout
 */
function createTimeLimiter(fn, milliseconds = 5000, message = 'Operation timed out') {
  return async (...args) => {
    try {
      const result = await pTimeout(fn(...args), milliseconds, () => {
        throw new Error(message);
      });
      return result;
    } catch (error) {
      console.error(`Time limiter error: ${error.message}`);
      throw error;
    }
  };
}

module.exports = { createTimeLimiter };