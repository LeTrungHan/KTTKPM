const retry = require('async-retry');

/**
 * Thực hiện retry cho một hàm bất đồng bộ
 * @param {Function} fn - Hàm cần retry
 * @param {Object} options - Các option cho retry
 * @returns {Promise} - Kết quả của hàm sau khi retry thành công
 */
async function retryOperation(fn, options = {}) {
  const defaultOptions = {
    retries: 3, // Số lần retry
    factor: 2, // Hệ số tăng thời gian chờ giữa các lần retry
    minTimeout: 1000, // Thời gian chờ tối thiểu (1 giây)
    maxTimeout: 5000, // Thời gian chờ tối đa (5 giây)
    randomize: true, // Ngẫu nhiên hóa thời gian chờ
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt} after error: ${error.message}`);
    }
  };

  const retryOptions = { ...defaultOptions, ...options };

  return retry(async (bail, attempt) => {
    try {
      return await fn();
    } catch (error) {
      // Đối với một số lỗi, không nên retry
      if (error.statusCode === 400 || error.statusCode === 401 || error.statusCode === 403) {
        bail(error); // Không retry cho lỗi 400, 401, 403
        return;
      }
      throw error; // Retry cho các lỗi khác
    }
  }, retryOptions);
}

module.exports = { retryOperation };
