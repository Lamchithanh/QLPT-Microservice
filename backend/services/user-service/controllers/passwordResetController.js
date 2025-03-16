const PasswordReset = require("../models/PasswordReset");
const User = require("../models/User");
const crypto = require("crypto");

// @desc    Yêu cầu đặt lại mật khẩu
// @route   POST /api/password-reset/request
// @access  Public
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Kiểm tra xem email có tồn tại không
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng với email này",
      });
    }

    // Tạo token ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Mã hóa token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Lưu token vào database
    await PasswordReset.create({
      user_id: user._id,
      token: hashedToken,
      expires_at: Date.now() + 10 * 60 * 1000, // 10 phút
    });

    // Trong thực tế, bạn sẽ gửi email với link đặt lại mật khẩu
    // Ví dụ: https://your-app.com/reset-password?token=${resetToken}

    res.status(200).json({
      success: true,
      message: "Đã gửi email đặt lại mật khẩu",
      resetToken, // Chỉ trả về trong môi trường phát triển
    });
  } catch (error) {
    console.error("Lỗi yêu cầu đặt lại mật khẩu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Đặt lại mật khẩu
// @route   POST /api/password-reset/reset
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Mã hóa token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Tìm token trong database
    const passwordReset = await PasswordReset.findOne({
      token: hashedToken,
      expires_at: { $gt: Date.now() },
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Tìm user
    const user = await User.findById(passwordReset.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Cập nhật mật khẩu
    user.password = password;
    await user.save();

    // Xóa token
    await PasswordReset.deleteMany({ user_id: user._id });

    res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
