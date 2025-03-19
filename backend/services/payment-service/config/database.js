const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const logger = require("./logger");

// Chỉ định đường dẫn chính xác đến file .env
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Kết nối đến MongoDB
 * @returns {Promise} Promise kết nối
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MongoDB URI không được cấu hình trong biến môi trường");
    }

    // Cấu hình kết nối MongoDB
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout sau 5s nếu không thể kết nối
      maxPoolSize: 10, // Số lượng kết nối tối đa trong pool
    };

    // Kết nối đến MongoDB
    await mongoose.connect(mongoURI, options);

    logger.info("Kết nối thành công đến MongoDB");

    // Xử lý sự kiện kết nối
    mongoose.connection.on("error", (err) => {
      logger.error("Lỗi kết nối MongoDB:", { error: err.message });
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("Mất kết nối đến MongoDB");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("Đã kết nối lại với MongoDB");
    });

    // Xử lý khi ứng dụng đóng
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("Đã đóng kết nối MongoDB do ứng dụng kết thúc");
      process.exit(0);
    });

    return mongoose.connection;
  } catch (error) {
    logger.error("Không thể kết nối đến MongoDB:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = connectDB;
