require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const circuitBreaker = require("opossum");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./docs/swagger");
const os = require("os");

// Chỉ import nếu sử dụng
const USE_SERVICE_DISCOVERY = process.env.USE_SERVICE_DISCOVERY === "true";
const USE_MESSAGE_BROKER = process.env.USE_MESSAGE_BROKER === "true";
const USE_REDIS_CACHE = process.env.USE_REDIS_CACHE === "true";

// Khởi tạo các service
const consulService = USE_SERVICE_DISCOVERY
  ? require("./services/consul.service")
  : null;
const messageBroker = USE_MESSAGE_BROKER
  ? require("./services/message-broker.service")
  : null;
const redisService = USE_REDIS_CACHE ? require("./config/redis") : null;

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // giới hạn mỗi IP 100 request mỗi windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Khởi tạo Redis nếu được bật
if (USE_REDIS_CACHE && redisService) {
  redisService.initRedis();
}

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Import routes
const cacheRoutes = USE_REDIS_CACHE ? require("./routes/cache.routes") : null;

// Service URLs
let userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:5001";
let apartmentServiceUrl =
  process.env.APARTMENT_SERVICE_URL || "http://localhost:5002";
let paymentServiceUrl =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:5003";

// Đăng ký service với Consul
if (USE_SERVICE_DISCOVERY && consulService) {
  consulService.registerService({
    name: "api-gateway",
    address: os.hostname(),
    port: parseInt(PORT),
    check: {
      http: `http://localhost:${PORT}/api/health`,
      interval: "10s",
      timeout: "5s",
    },
  });

  // Lấy địa chỉ service từ Consul
  consulService.getServiceAddress("user-service").then((address) => {
    if (address) userServiceUrl = address;
  });

  consulService.getServiceAddress("apartment-service").then((address) => {
    if (address) apartmentServiceUrl = address;
  });

  consulService.getServiceAddress("payment-service").then((address) => {
    if (address) paymentServiceUrl = address;
  });
}

// Kết nối Message Broker
if (USE_MESSAGE_BROKER && messageBroker) {
  messageBroker.connect().then(() => {
    messageBroker.setupExchanges();
  });
}

// Health check route
app.get("/api/health", (req, res) => {
  const healthInfo = {
    service: "API Gateway",
    status: "running",
    timestamp: new Date().toISOString(),
    services: {
      userService: userServiceUrl,
      apartmentService: apartmentServiceUrl,
      paymentService: paymentServiceUrl,
    },
    serviceDiscovery: USE_SERVICE_DISCOVERY ? "enabled" : "disabled",
    messageBroker: USE_MESSAGE_BROKER ? "enabled" : "disabled",
    redisCache: USE_REDIS_CACHE ? "enabled" : "disabled",
  };

  res.json(healthInfo);
});

// Circuit Breaker options
const circuitOptions = {
  timeout: 5000, // Thời gian chờ trước khi timeout
  errorThresholdPercentage: 50, // % lỗi để mở circuit
  resetTimeout: 30000, // Thời gian trước khi thử lại
};

// Proxy middleware với Circuit Breaker
const createProxyWithCircuitBreaker = (target, pathRewrite) => {
  const proxyMiddleware = createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
  });

  const breaker = new circuitBreaker((req, res, next) => {
    proxyMiddleware(req, res, next);
  }, circuitOptions);

  breaker.fallback((req, res) => {
    res.status(503).json({
      status: "error",
      message: "Service temporarily unavailable. Please try again later.",
    });
  });

  return (req, res, next) => {
    breaker.fire(req, res, next).catch((error) => {
      console.error("Circuit breaker error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    });
  };
};

// Routes với proxy
app.use(
  "/api/users",
  createProxyWithCircuitBreaker(userServiceUrl, { "^/api/users": "/api/users" })
);

app.use(
  "/api/apartments",
  createProxyWithCircuitBreaker(apartmentServiceUrl, {
    "^/api/apartments": "/api/apartments",
  })
);

app.use(
  "/api/payments",
  createProxyWithCircuitBreaker(paymentServiceUrl, {
    "^/api/payments": "/api/payments",
  })
);

// Cache routes
if (USE_REDIS_CACHE && cacheRoutes) {
  app.use("/api/cache", cacheRoutes);
}

// Test route cho message broker
app.post("/api/test/publish-event", (req, res) => {
  if (!USE_MESSAGE_BROKER || !messageBroker) {
    return res.status(400).json({
      status: "error",
      message: "Message broker is not enabled",
    });
  }

  const { type, routingKey, data } = req.body;

  if (!type || !routingKey || !data) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields: type, routingKey, data",
    });
  }

  const exchangeName = `${type}.events`;
  messageBroker.publishToExchange(exchangeName, routingKey, data);

  res.json({
    status: "success",
    message: `Event published to ${exchangeName} with routing key ${routingKey}`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(
    `API Documentation available at http://localhost:${PORT}/api-docs`
  );
  console.log(
    `Service Discovery: ${USE_SERVICE_DISCOVERY ? "Enabled" : "Disabled"}`
  );
  console.log(`Message Broker: ${USE_MESSAGE_BROKER ? "Enabled" : "Disabled"}`);
  console.log(`Redis Cache: ${USE_REDIS_CACHE ? "Enabled" : "Disabled"}`);
  console.log(`User Service: ${userServiceUrl}`);
  console.log(`Apartment Service: ${apartmentServiceUrl}`);
  console.log(`Payment Service: ${paymentServiceUrl}`);
});
