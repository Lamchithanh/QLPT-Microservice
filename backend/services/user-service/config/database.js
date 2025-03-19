const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const logger = require("./logger");

// Chỉ định đường dẫn chính xác đến file .env
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Các options đã được tự động áp dụng trong mongoose 6+
    });

    logger.info("Kết nối thành công đến MongoDB");

    // Xử lý sự kiện mất kết nối
    mongoose.connection.on("disconnected", () => {
      logger.warn("Mất kết nối đến MongoDB");
    });

    // Xử lý khi ứng dụng kết thúc
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("Đã đóng kết nối MongoDB do ứng dụng kết thúc");
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error(`Lỗi kết nối đến MongoDB: ${error.message}`, {
      stack: error.stack,
    });
    process.exit(1);
  }
};

module.exports = connectDB;
