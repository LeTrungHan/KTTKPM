const Customer = require('../models/customer.model');

// Tạo khách hàng mới
exports.createCustomer = async (customerData) => {
  const customer = new Customer(customerData);
  return await customer.save();
};

// Lấy tất cả khách hàng
exports.getAllCustomers = async () => {
  return await Customer.find();
};

// Lấy khách hàng theo ID
exports.getCustomerById = async (id) => {
  return await Customer.findById(id);
};

// Lấy khách hàng theo email
exports.getCustomerByEmail = async (email) => {
  return await Customer.findOne({ email });
};

// Cập nhật khách hàng
exports.updateCustomer = async (id, customerData) => {
  return await Customer.findByIdAndUpdate(id, customerData, { new: true });
};

// Xóa khách hàng
exports.deleteCustomer = async (id) => {
  return await Customer.findByIdAndDelete(id);
};

// Thêm địa chỉ mới
exports.addAddress = async (id, addressData) => {
  const customer = await Customer.findById(id);
  
  if (!customer) {
    return null;
  }
  
  customer.addresses.push(addressData);
  return await customer.save();
};

// Đặt địa chỉ mặc định
exports.setDefaultAddress = async (id, addressIndex) => {
  const customer = await Customer.findById(id);
  
  if (!customer) {
    return null;
  }
  
  if (addressIndex < 0 || addressIndex >= customer.addresses.length) {
    throw new Error('Chỉ số địa chỉ không hợp lệ');
  }
  
  customer.defaultAddress = addressIndex;
  return await customer.save();
};