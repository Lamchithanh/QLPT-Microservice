const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load biến môi trường TRƯỚC KHI import các model
// Chỉ định đường dẫn chính xác đến file .env
dotenv.config({ path: path.join(__dirname, "../.env") });

// Kiểm tra URI kết nối
console.log("MongoDB URI:", process.env.MONGO_URI);
if (process.env.MONGO_URI) {
  console.log("Database name:", process.env.MONGO_URI.split("/").pop());
} else {
  console.error("MONGO_URI không được định nghĩa trong file .env");
  process.exit(1);
}

const connectDB = require("../config/database");

// Import các model
const Contract = require("../models/Contract");
const Service = require("../models/Service");
const ServiceUsage = require("../models/ServiceUsage");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");

// Dữ liệu mẫu
const sampleData = {
  services: [
    {
      name: "Điện",
      price_unit: "kWh",
      price: 3500,
      description: "Giá điện sinh hoạt",
    },
    {
      name: "Nước",
      price_unit: "m3",
      price: 15000,
      description: "Giá nước sinh hoạt",
    },
    {
      name: "Internet",
      price_unit: "tháng",
      price: 200000,
      description: "Phí internet hàng tháng",
    },
    {
      name: "Dọn vệ sinh",
      price_unit: "lần",
      price: 100000,
      description: "Phí dọn vệ sinh",
    },
  ],
};

// Hàm khởi tạo database
const initDb = async () => {
  try {
    // Kết nối đến MongoDB
    await connectDB();

    console.log("Bắt đầu khởi tạo dữ liệu...");

    // Xóa dữ liệu cũ (nếu cần)
    await Service.deleteMany({});
    await Contract.deleteMany({});
    await ServiceUsage.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});

    console.log("Đã xóa dữ liệu cũ");

    // Tạo dịch vụ
    const createdServices = await Service.create(sampleData.services);
    console.log(`Đã tạo ${createdServices.length} dịch vụ`);

    // Tạo hợp đồng mẫu
    // Lưu ý: Trong thực tế, bạn cần lấy room_id và tenant_id từ database thật
    const dummyRoomId = new mongoose.Types.ObjectId();
    const dummyTenantId = new mongoose.Types.ObjectId();

    const contract = await Contract.create({
      display_code: "HD" + Date.now().toString().slice(-6),
      room_id: dummyRoomId,
      tenant_id: dummyTenantId,
      start_date: new Date(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      deposit_amount: 5000000,
      monthly_rent: 3500000,
      payment_date: 5,
      terms_conditions: "Các điều khoản và điều kiện của hợp đồng...",
      status: "active",
    });

    console.log("Đã tạo hợp đồng:", contract.id);

    // Tạo hóa đơn mẫu
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const invoice = await Invoice.create({
      contract_id: contract._id,
      month: currentMonth,
      year: currentYear,
      room_fee: contract.monthly_rent,
      services_fee: {
        Điện: 350000,
        Nước: 150000,
        Internet: 200000,
      },
      total_amount: contract.monthly_rent + 350000 + 150000 + 200000,
      due_date: new Date(
        currentYear,
        currentMonth - 1,
        contract.payment_date + 10
      ),
      status: "pending",
      note: "Hóa đơn tháng " + currentMonth,
    });

    console.log("Đã tạo hóa đơn:", invoice.id);

    // Tạo dữ liệu sử dụng dịch vụ
    const electricService = createdServices.find((s) => s.name === "Điện");
    const waterService = createdServices.find((s) => s.name === "Nước");

    if (electricService && waterService) {
      const serviceUsages = await ServiceUsage.create([
        {
          contract_id: contract._id,
          service_id: electricService._id,
          previous_reading: 0,
          current_reading: 100,
          usage_amount: 100,
          month: currentMonth,
          year: currentYear,
        },
        {
          contract_id: contract._id,
          service_id: waterService._id,
          previous_reading: 0,
          current_reading: 10,
          usage_amount: 10,
          month: currentMonth,
          year: currentYear,
        },
      ]);

      console.log(`Đã tạo ${serviceUsages.length} dữ liệu sử dụng dịch vụ`);
    }

    console.log("Khởi tạo dữ liệu thành công!");
  } catch (error) {
    console.error("Lỗi khởi tạo dữ liệu:", error);
  } finally {
    // Đóng kết nối
    mongoose.connection.close();
    console.log("Đã đóng kết nối database");
  }
};

// Chạy hàm khởi tạo
initDb();
