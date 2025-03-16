const mongoose = require("mongoose");

/**
 * Schema hóa đơn
 */
const invoiceSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.ObjectId,
      ref: "Contract",
      required: [true, "Hóa đơn phải thuộc về một hợp đồng"],
    },
    tenant: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Hóa đơn phải thuộc về một người thuê"],
    },
    room: {
      type: mongoose.Schema.ObjectId,
      ref: "Room",
      required: [true, "Hóa đơn phải thuộc về một phòng"],
    },
    amount: {
      type: Number,
      required: [true, "Hóa đơn phải có số tiền"],
    },
    description: {
      type: String,
      required: [true, "Hóa đơn phải có mô tả"],
    },
    invoiceType: {
      type: String,
      enum: ["rent", "utility", "service", "other"],
      default: "rent",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: [true, "Hóa đơn phải có ngày đến hạn"],
    },
    paymentDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Hóa đơn phải được tạo bởi một người dùng"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
invoiceSchema.index({ contract: 1, dueDate: 1 });
invoiceSchema.index({ tenant: 1, status: 1 });
invoiceSchema.index({ room: 1, status: 1 });

// Virtual populate
invoiceSchema.virtual("payments", {
  ref: "Payment",
  foreignField: "invoice",
  localField: "_id",
});

// Middleware trước khi lưu
invoiceSchema.pre("save", function (next) {
  // Nếu hóa đơn đã thanh toán, đặt ngày thanh toán
  if (this.status === "paid" && !this.paymentDate) {
    this.paymentDate = Date.now();
  }
  next();
});

// Middleware trước khi tìm
invoiceSchema.pre(/^find/, function (next) {
  this.populate({
    path: "tenant",
    select: "name email",
  }).populate({
    path: "room",
    select: "name roomNumber",
  });
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
