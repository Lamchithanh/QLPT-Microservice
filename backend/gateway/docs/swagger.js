const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "QLPT Microservices API",
      version: "1.0.0",
      description:
        "API Documentation cho hệ thống Quản lý Phòng Trọ Microservices",
      contact: {
        name: "QLPT Support",
        email: "support@qlpt.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "User",
        description: "API quản lý người dùng",
      },
      {
        name: "Apartment",
        description: "API quản lý căn hộ và phòng",
      },
      {
        name: "Payment",
        description: "API quản lý thanh toán và hóa đơn",
      },
    ],
  },
  apis: [
    "./docs/routes/*.js", // Đường dẫn tới các file định nghĩa route
    "./server.js", // File server chính
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
