const dotenv = require("dotenv");
const path = require("path");

// Load biến môi trường
dotenv.config({ path: path.join(__dirname, ".env") });

const app = require("./app");
const connectDB = require("./config/database");
const mongoose = require("mongoose");
const logger = require("./config/logger");

// Xử lý lỗi không được xử lý
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...");
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

// Health check route
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus;

  switch (dbState) {
    case 0:
      dbStatus = "Disconnected";
      break;
    case 1:
      dbStatus = "Connected";
      break;
    case 2:
      dbStatus = "Connecting";
      break;
    case 3:
      dbStatus = "Disconnecting";
      break;
    default:
      dbStatus = "Unknown";
  }

  res.json({
    service: "Payment Service",
    status: "running",
    timestamp: new Date(),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || "Not connected",
      host: mongoose.connection.host || "Not connected",
    },
  });
});

// Kết nối đến database và khởi động server
connectDB()
  .then(() => {
    logger.info("Connected to MongoDB");

    // Khởi động server
    const PORT = process.env.PORT || 5003;
    const server = app.listen(PORT, () => {
      logger.info(`Payment Service is running on port ${PORT}`);

      // Hiển thị URI MongoDB an toàn (ẩn mật khẩu)
      const mongoURI = process.env.MONGODB_URI || "";
      const safeMongoURI = mongoURI.replace(/:([^@]+)@/, ":****@");
      logger.info(`MongoDB URI: ${safeMongoURI}`);
    });

    // Xử lý lỗi không được xử lý trong promise
    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION! Shutting down...");
      logger.error(`${err.name}: ${err.message}`, { stack: err.stack });
      server.close(() => {
        process.exit(1);
      });
    });

    // Xử lý SIGTERM
    process.on("SIGTERM", () => {
      logger.info("SIGTERM RECEIVED. Shutting down gracefully");
      server.close(() => {
        logger.info("Process terminated!");
      });
    });
  })
  .catch((err) => {
    logger.error("Database connection error:", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
