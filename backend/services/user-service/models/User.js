const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Vui lòng nhập tên người dùng"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Vui lòng nhập mật khẩu"],
      minlength: 8,
      select: false,
    },
    email: {
      type: String,
      required: [true, "Vui lòng nhập email"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Email không hợp lệ"],
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^\d{10}$/.test(v);
        },
        message: (props) =>
          `${props.value} không phải là số điện thoại hợp lệ!`,
      },
    },
    full_name: {
      type: String,
      trim: true,
    },
    cccd: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "staff", "tenant", "landlord_pending", "landlord"],
      default: "tenant",
    },
    status: {
      type: Boolean,
      default: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });

// Mã hóa mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  // Chỉ mã hóa mật khẩu nếu nó được sửa đổi
  if (!this.isModified("password")) return next();

  // Mã hóa mật khẩu với độ phức tạp 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Phương thức kiểm tra mật khẩu
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
