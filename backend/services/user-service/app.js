const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const userRoutes = require("./routes/userRoutes");
const landlordRoutes = require("./routes/landlordRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");

const app = express();

// Middleware bảo mật
app.use(helmet()); // Bảo mật HTTP headers
app.use(xss()); // Ngăn chặn XSS attacks
app.use(mongoSanitize()); // Ngăn chặn NoSQL injection

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn 100 request mỗi IP trong 15 phút
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Middleware cơ bản
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Logging trong môi trường phát triển
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/users", userRoutes);
app.use("/api/landlords", landlordRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/password-reset", passwordResetRoutes);

// Route mặc định
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to User Service API",
    version: "1.0.0",
  });
});

// Xử lý route không tồn tại
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} không tồn tại`,
  });
});

// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error("Lỗi:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Lỗi server",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

module.exports = app;
