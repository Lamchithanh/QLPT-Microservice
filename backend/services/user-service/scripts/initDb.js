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
const User = require("../models/User");
const Landlord = require("../models/Landlord");
const Tenant = require("../models/Tenant");
const PasswordReset = require("../models/PasswordReset");
const Notification = require("../models/Notification");

// Dữ liệu mẫu
const sampleData = {
  users: [
    {
      username: "admin",
      password: "password123",
      email: "admin@example.com",
      phone: "0123456789",
      full_name: "Admin User",
      role: "admin",
      status: true,
    },
    {
      username: "tenant1",
      password: "password123",
      email: "tenant1@example.com",
      phone: "0123456788",
      full_name: "Tenant User",
      role: "tenant",
      status: true,
    },
    {
      username: "landlord1",
      password: "password123",
      email: "landlord1@example.com",
      phone: "0123456787",
      full_name: "Landlord User",
      role: "landlord",
      status: true,
    },
  ],
};

// Hàm khởi tạo database
const initDb = async () => {
  try {
    // Kết nối đến MongoDB
    await connectDB();

    // Kiểm tra tên database sau khi kết nối
    console.log("Connected to database:", mongoose.connection.db.databaseName);

    console.log("Bắt đầu khởi tạo dữ liệu...");

    // Xóa dữ liệu cũ (nếu cần)
    await User.deleteMany({});
    await Landlord.deleteMany({});
    await Tenant.deleteMany({});
    await PasswordReset.deleteMany({});
    await Notification.deleteMany({});

    console.log("Đã xóa dữ liệu cũ");

    // Tạo người dùng
    const createdUsers = await User.create(sampleData.users);
    console.log(`Đã tạo ${createdUsers.length} người dùng`);

    // Tạo landlord từ user có role landlord
    const landlordUser = createdUsers.find((user) => user.role === "landlord");
    if (landlordUser) {
      const landlord = await Landlord.create({
        user_id: landlordUser._id,
        id_card_number: "123456789012",
        address: "123 Đường ABC, Quận 1, TP.HCM",
        status: "approved",
      });
      console.log("Đã tạo landlord:", landlord.id);
    }

    // Tạo tenant từ user có role tenant
    const tenantUser = createdUsers.find((user) => user.role === "tenant");
    if (tenantUser) {
      const tenant = await Tenant.create({
        user_id: tenantUser._id,
        full_name: tenantUser.full_name,
        id_card_number: "123456789013",
        permanent_address: "456 Đường XYZ, Quận 2, TP.HCM",
        phone: tenantUser.phone,
      });
      console.log("Đã tạo tenant:", tenant.id);
    }

    // Tạo thông báo mẫu
    const notification = await Notification.create({
      user_id: createdUsers[0]._id,
      type: "general",
      title: "Chào mừng đến với hệ thống",
      content:
        "Cảm ơn bạn đã sử dụng hệ thống quản lý phòng trọ của chúng tôi.",
      is_read: false,
      severity: "low",
    });
    console.log("Đã tạo thông báo:", notification.id);

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
