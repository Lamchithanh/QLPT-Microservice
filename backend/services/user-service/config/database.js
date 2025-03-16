const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Chỉ định đường dẫn chính xác đến file .env
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    // Kiểm tra URI kết nối
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI không được định nghĩa trong file .env");
    }

    // Kiểm tra tên database trong URI
    const dbName = process.env.MONGO_URI.split("/").pop().split("?")[0];
    if (dbName.toLowerCase() === "qlpt") {
      console.warn(
        "CẢNH BÁO: Bạn đang kết nối đến database QLPT thay vì database riêng biệt!"
      );
      console.warn("Vui lòng kiểm tra lại URI kết nối trong file .env");
    }

    // Kết nối đến MongoDB với tên database chính xác
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(
      `Connection State: ${
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
      }`
    );

    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
