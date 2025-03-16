const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const testRoutes = require("./routes/testRoutes");
const path = require("path");

// Load biến môi trường
dotenv.config({ path: path.join(__dirname, ".env") });

// Kết nối đến database
connectDB()
  .then(() => {
    console.log("Connected to MongoDB");

    // Khởi tạo express app
    const app = express();
    const PORT = process.env.PORT || 5001;

    // Middleware
    app.use(cors());
    app.use(helmet());
    app.use(morgan("dev"));
    app.use(express.json());

    // Routes
    app.use("/api/users", userRoutes);
    app.use("/api/test", testRoutes);

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
        service: "User Service",
        status: "running",
        timestamp: new Date(),
        database: {
          status: dbStatus,
          name: mongoose.connection.name,
          host: mongoose.connection.host,
        },
      });
    });

    // Kiểm tra kết nối
    app.get("/", (req, res) => {
      res.send("User Service API is running...");
    });

    // Khởi động server
    const server = app.listen(PORT, () => {
      console.log(`User Service is running on port ${PORT}`);
    });

    // Xử lý lỗi không được xử lý trong promise
    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! Shutting down...");
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Xử lý SIGTERM
    process.on("SIGTERM", () => {
      console.log("SIGTERM RECEIVED. Shutting down gracefully");
      server.close(() => {
        console.log("Process terminated!");
      });
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

// Xử lý lỗi không được xử lý
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});
