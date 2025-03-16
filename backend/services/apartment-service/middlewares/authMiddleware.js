const jwt = require("jsonwebtoken");

// Middleware bảo vệ route - yêu cầu đăng nhập
exports.protect = async (req, res, next) => {
  try {
    // 1) Lấy token và kiểm tra xem nó có tồn tại không
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "Bạn chưa đăng nhập! Vui lòng đăng nhập để truy cập.",
      });
    }

    // 2) Xác minh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Lưu thông tin user vào request
    req.user = {
      id: decoded.id,
      role: decoded.role || "user", // Mặc định là user nếu không có role
    };

    next();
  } catch (err) {
    res.status(401).json({
      status: "fail",
      message: "Không có quyền truy cập. Vui lòng đăng nhập lại.",
    });
  }
};

// Middleware giới hạn quyền truy cập theo vai trò
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'manager']. role='user'
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    next();
  };
};
