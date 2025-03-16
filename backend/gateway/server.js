require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Proxy middleware configuration
const userServiceProxy = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/users": "/api/users",
  },
});

const apartmentServiceProxy = createProxyMiddleware({
  target: process.env.APARTMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/apartments": "/api/apartments",
  },
});

const paymentServiceProxy = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/payments": "/api/payments",
  },
});

// Routes
app.use("/api/users", userServiceProxy);
app.use("/api/apartments", apartmentServiceProxy);
app.use("/api/payments", paymentServiceProxy);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    service: "API Gateway",
    status: "running",
    timestamp: new Date(),
    services: {
      userService: process.env.USER_SERVICE_URL,
      apartmentService: process.env.APARTMENT_SERVICE_URL,
      paymentService: process.env.PAYMENT_SERVICE_URL,
    },
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("API Gateway is running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke in the API Gateway!");
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`User Service: ${process.env.USER_SERVICE_URL}`);
  console.log(`Apartment Service: ${process.env.APARTMENT_SERVICE_URL}`);
  console.log(`Payment Service: ${process.env.PAYMENT_SERVICE_URL}`);
});
