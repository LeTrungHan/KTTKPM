const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Xác thực thất bại: Không có token' });
    }
    
    // Xác thực token và lấy thông tin người dùng
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.userData = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Xác thực thất bại: Token không hợp lệ' });
  }
};