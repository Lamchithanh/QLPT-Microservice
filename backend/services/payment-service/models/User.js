const mongoose = require("mongoose");

/**
 * Schema người dùng cho payment-service
 * Lưu ý: Đây là schema tham chiếu, không phải schema chính
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng cung cấp tên người dùng"],
    },
    email: {
      type: String,
      required: [true, "Vui lòng cung cấp email"],
      unique: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["user", "tenant", "landlord", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Kiểm tra xem mật khẩu đã được thay đổi sau khi token được cấp
 * @param {Number} JWTTimestamp - Thời gian token được cấp
 * @returns {Boolean} - true nếu mật khẩu đã thay đổi sau khi token được cấp
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False nghĩa là KHÔNG thay đổi
  return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
