const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const apartmentRoutes = require("./routes/apartmentRoutes");
const roomRoutes = require("./routes/roomRoutes");
const amenityRoutes = require("./routes/amenityRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");

// Khởi tạo app
const app = express();

// Middleware bảo mật
app.use(helmet()); // Bảo vệ HTTP headers
app.use(xss()); // Ngăn chặn XSS attacks
app.use(mongoSanitize()); // Ngăn chặn NoSQL injection

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 request mỗi IP trong 15 phút
  message: "Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút!",
});
app.use("/api", limiter);

// Middleware cơ bản
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Logging trong môi trường development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Chào mừng đến với Apartment Service API",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/apartments", apartmentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/amenities", amenityRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/maintenance", maintenanceRoutes);

// Xử lý route không tồn tại
app.all("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Không tìm thấy ${req.originalUrl} trên server này!`,
  });
});

// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    status,
    message: err.message || "Đã xảy ra lỗi trong Apartment Service!",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

module.exports = app;
