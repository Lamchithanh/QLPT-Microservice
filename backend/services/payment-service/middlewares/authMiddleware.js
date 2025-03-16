const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/User");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

/**
 * Middleware bảo vệ route, yêu cầu người dùng đăng nhập
 */
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Lấy token từ header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("Bạn chưa đăng nhập! Vui lòng đăng nhập để truy cập.", 401)
    );
  }

  // 2) Xác thực token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Kiểm tra nếu người dùng vẫn tồn tại
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("Người dùng sở hữu token này không còn tồn tại.", 401)
    );
  }

  // 4) Kiểm tra nếu người dùng đã thay đổi mật khẩu sau khi token được cấp
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "Người dùng đã thay đổi mật khẩu! Vui lòng đăng nhập lại.",
        401
      )
    );
  }

  // 5) Kiểm tra nếu tài khoản đã bị vô hiệu hóa
  if (!currentUser.isActive) {
    return next(new AppError("Tài khoản của bạn đã bị vô hiệu hóa.", 401));
  }

  // Cấp quyền truy cập vào route được bảo vệ
  req.user = currentUser;
  next();
});

/**
 * Middleware hạn chế quyền truy cập dựa trên vai trò
 * @param  {...String} roles - Các vai trò được phép truy cập
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'landlord']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Bạn không có quyền thực hiện hành động này", 403)
      );
    }

    next();
  };
};

/**
 * Middleware hạn chế quyền truy cập chỉ cho admin
 */
exports.admin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(
      new AppError("Bạn không có quyền thực hiện hành động này", 403)
    );
  }
  next();
};
