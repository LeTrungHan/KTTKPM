function errorHandler(err, req, res, next) {
    console.error('Error occurred:', err);
    
    // Xử lý các loại lỗi khác nhau
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: err.message,
        details: err.errors
      });
    }
    
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }
    
    if (err.name === 'ForbiddenError') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }
    
    if (err.name === 'NotFoundError') {
      return res.status(404).json({
        error: 'Not Found',
        message: err.message || 'Resource not found'
      });
    }
    
    // Lỗi từ Circuit Breaker
    if (err.message && err.message.includes('Service temporarily unavailable')) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: err.message
      });
    }
    
    // Lỗi từ Time Limiter
    if (err.message && err.message.includes('timed out')) {
      return res.status(504).json({
        error: 'Gateway Timeout',
        message: 'Service request timed out'
      });
    }
    
    // Lỗi mặc định
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
  
  module.exports = errorHandler;