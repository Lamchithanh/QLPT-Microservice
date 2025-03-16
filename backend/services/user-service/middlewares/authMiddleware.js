const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware bảo vệ route - yêu cầu đăng nhập
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Kiểm tra xem có token trong header không
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.",
      });
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra xem user có tồn tại không
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại.",
      });
    }

    // Kiểm tra xem tài khoản có bị khóa không
    if (!currentUser.status) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản đã bị khóa.",
      });
    }

    // Lưu thông tin user vào request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ. Vui lòng đăng nhập lại.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn. Vui lòng đăng nhập lại.",
      });
    }

    console.error("Lỗi xác thực:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Middleware giới hạn quyền truy cập
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    next();
  };
};
