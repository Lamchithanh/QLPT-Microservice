const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PaymentSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      enum: ["cash", "bank_transfer", "credit_card", "vnpay", "momo", "paypal"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    refunded: {
      type: Boolean,
      default: false,
    },
    refundedAmount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Object,
      default: {},
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index cho tìm kiếm nhanh
PaymentSchema.index({ invoice: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ "metadata.vnpayOrderId": 1 });

// Kiểm tra xem model đã tồn tại chưa trước khi tạo mới
module.exports =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
