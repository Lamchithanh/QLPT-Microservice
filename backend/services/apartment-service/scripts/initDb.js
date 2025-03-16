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
const Room = require("../models/Room");
const Amenity = require("../models/Amenity");
const Review = require("../models/Review");
const UserFavorite = require("../models/UserFavorite");
const MaintenanceRequest = require("../models/MaintenanceRequest");

// Dữ liệu mẫu
const sampleData = {
  amenities: [
    { name: "Máy lạnh", icon: "air_conditioner" },
    { name: "Tủ lạnh", icon: "refrigerator" },
    { name: "Máy giặt", icon: "washing_machine" },
    { name: "Wifi", icon: "wifi" },
    { name: "Bếp", icon: "kitchen" },
  ],
  rooms: [
    {
      room_type: "boarding_house",
      title: "Phòng trọ cao cấp quận 1",
      address: "123 Đường ABC, Quận 1, TP.HCM",
      room_number: "A101",
      floor: 1,
      area: 25,
      price: 3500000,
      status: "available",
      description: "Phòng trọ cao cấp, đầy đủ tiện nghi, gần trung tâm.",
      facilities: new Map([
        ["air_conditioner", true],
        ["refrigerator", true],
        ["washing_machine", false],
        ["wifi", true],
      ]),
      nearby_locations: [
        { name: "Trường Đại học ABC", distance: 0.5, type: "education" },
        { name: "Siêu thị XYZ", distance: 0.3, type: "shopping" },
      ],
      images: ["room1_1.jpg", "room1_2.jpg"],
    },
    {
      room_type: "mini_apartment",
      title: "Căn hộ mini quận 2",
      address: "456 Đường XYZ, Quận 2, TP.HCM",
      room_number: "B202",
      floor: 2,
      area: 35,
      price: 5000000,
      status: "available",
      description: "Căn hộ mini đầy đủ tiện nghi, an ninh 24/7.",
      facilities: new Map([
        ["air_conditioner", true],
        ["refrigerator", true],
        ["washing_machine", true],
        ["wifi", true],
      ]),
      nearby_locations: [
        { name: "Bệnh viện DEF", distance: 1.0, type: "health" },
        { name: "Công viên GHI", distance: 0.5, type: "recreation" },
      ],
      images: ["room2_1.jpg", "room2_2.jpg"],
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
    await Room.deleteMany({});
    await Amenity.deleteMany({});
    await Review.deleteMany({});
    await UserFavorite.deleteMany({});
    await MaintenanceRequest.deleteMany({});

    console.log("Đã xóa dữ liệu cũ");

    // Tạo tiện ích
    const createdAmenities = await Amenity.create(sampleData.amenities);
    console.log(`Đã tạo ${createdAmenities.length} tiện ích`);

    // Tạo phòng
    // Lưu ý: Trong thực tế, bạn cần lấy landlord_id từ database thật
    const dummyLandlordId = new mongoose.Types.ObjectId();

    const roomsWithLandlord = sampleData.rooms.map((room) => ({
      ...room,
      landlord_id: dummyLandlordId,
    }));

    const createdRooms = await Room.create(roomsWithLandlord);
    console.log(`Đã tạo ${createdRooms.length} phòng`);

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
