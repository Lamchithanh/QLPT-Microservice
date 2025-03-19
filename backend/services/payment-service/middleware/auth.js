const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

/**
 * Middleware xác thực người dùng
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.authenticate = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Không có token xác thực",
      });
    }

    const token = authHeader.split(" ")[1];

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gán thông tin người dùng vào request
    req.user = decoded;

    next();
  } catch (error) {
    logger.error("Authentication error:", { error: error.message });

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token đã hết hạn",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Token không hợp lệ",
      });
    }

    return res.status(401).json({
      status: "error",
      message: "Không được phép truy cập",
    });
  }
};

/**
 * Middleware kiểm tra quyền admin
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    logger.warn("Unauthorized admin access attempt", {
      userId: req.user ? req.user.id : "unknown",
      role: req.user ? req.user.role : "unknown",
    });

    return res.status(403).json({
      status: "error",
      message: "Bạn không có quyền thực hiện hành động này",
    });
  }

  next();
};

/**
 * Middleware kiểm tra quyền quản lý
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.authorizeManager = (req, res, next) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "manager")) {
    logger.warn("Unauthorized manager access attempt", {
      userId: req.user ? req.user.id : "unknown",
      role: req.user ? req.user.role : "unknown",
    });

    return res.status(403).json({
      status: "error",
      message: "Bạn không có quyền thực hiện hành động này",
    });
  }

  next();
};
