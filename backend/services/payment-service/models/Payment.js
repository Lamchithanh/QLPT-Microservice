const mongoose = require("mongoose");

/**
 * Schema thanh toán
 */
const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.ObjectId,
      ref: "Invoice",
      required: [true, "Thanh toán phải thuộc về một hóa đơn"],
    },
    tenant: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Thanh toán phải thuộc về một người thuê"],
    },
    amount: {
      type: Number,
      required: [true, "Thanh toán phải có số tiền"],
    },
    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "bank_transfer",
        "credit_card",
        "momo",
        "zalopay",
        "other",
      ],
      required: [true, "Thanh toán phải có phương thức thanh toán"],
    },
    transactionId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Thanh toán phải được tạo bởi một người dùng"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ tenant: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: 1 });

// Middleware trước khi tìm
paymentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "tenant",
    select: "name email",
  }).populate({
    path: "invoice",
    select: "amount dueDate status",
  });
  next();
});

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
