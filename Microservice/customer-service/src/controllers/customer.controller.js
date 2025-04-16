const Customer = require('../models/customer.model');
const customerService = require('../services/customer.service');

// Tạo khách hàng mới
exports.createCustomer = async (req, res) => {
  try {
    // Kiểm tra email đã tồn tại chưa
    const existingCustomer = await customerService.getCustomerByEmail(req.body.email);
    if (existingCustomer) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    
    const customer = await customerService.createCustomer(req.body);
    
    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    
    // Không gửi password trong event
    const customerEvent = { ...customer.toObject() };
    delete customerEvent.password;
    
    publishToRabbitMQ('customer.created', { customer: customerEvent });
    
    // Không trả về password trong response
    const customerResponse = { ...customer.toObject() };
    delete customerResponse.password;
    
    res.status(201).json(customerResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy tất cả khách hàng
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await customerService.getAllCustomers();
    
    // Loại bỏ password từ kết quả trả về
    const customersResponse = customers.map(customer => {
      const customerObj = customer.toObject();
      delete customerObj.password;
      return customerObj;
    });
    
    res.status(200).json(customersResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy khách hàng theo ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }
    
    // Loại bỏ password từ kết quả trả về
    const customerResponse = { ...customer.toObject() };
    delete customerResponse.password;
    
    res.status(200).json(customerResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin khách hàng
exports.updateCustomer = async (req, res) => {
  try {
    // Kiểm tra nếu đang thay đổi email
    if (req.body.email) {
      const existingCustomer = await customerService.getCustomerByEmail(req.body.email);
      if (existingCustomer && existingCustomer._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }
    
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    
    // Không gửi password trong event
    const customerEvent = { ...customer.toObject() };
    delete customerEvent.password;
    
    publishToRabbitMQ('customer.updated', { customer: customerEvent });
    
    // Không trả về password trong response
    const customerResponse = { ...customer.toObject() };
    delete customerResponse.password;
    
    res.status(200).json(customerResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa khách hàng
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await customerService.deleteCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    // Publish event đến RabbitMQ
    const publishToRabbitMQ = req.app.get('publishToRabbitMQ');
    publishToRabbitMQ('customer.deleted', { customerId: req.params.id });
    
    res.status(200).json({ message: 'Đã xóa khách hàng thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thêm địa chỉ mới cho khách hàng
exports.addAddress = async (req, res) => {
  try {
    const customer = await customerService.addAddress(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }
    
    // Không trả về password trong response
    const customerResponse = { ...customer.toObject() };
    delete customerResponse.password;
    
    res.status(200).json(customerResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Đặt địa chỉ mặc định
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressIndex } = req.body;
    const customer = await customerService.setDefaultAddress(req.params.id, addressIndex);
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }
    
    // Không trả về password trong response
    const customerResponse = { ...customer.toObject() };
    delete customerResponse.password;
    
    res.status(200).json(customerResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};