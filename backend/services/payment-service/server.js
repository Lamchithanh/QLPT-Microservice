const dotenv = require("dotenv");
const path = require("path");

// Load biến môi trường
dotenv.config({ path: path.join(__dirname, ".env") });

const app = require("./app");
const connectDB = require("./config/database");
const mongoose = require("mongoose");

// Xử lý lỗi không được xử lý
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
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
    console.log("Connected to MongoDB");

    // Khởi động server
    const PORT = process.env.PORT || 5003;
    const server = app.listen(PORT, () => {
      console.log(`Payment Service is running on port ${PORT}`);
      console.log(`MongoDB URI: ${process.env.MONGO_URI.substring(0, 25)}...`);
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
