const mongoose = require("mongoose");

/**
 * Schema hợp đồng
 */
const contractSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Hợp đồng phải thuộc về một người thuê"],
    },
    room: {
      type: mongoose.Schema.ObjectId,
      ref: "Room",
      required: [true, "Hợp đồng phải thuộc về một phòng"],
    },
    startDate: {
      type: Date,
      required: [true, "Hợp đồng phải có ngày bắt đầu"],
    },
    endDate: {
      type: Date,
      required: [true, "Hợp đồng phải có ngày kết thúc"],
    },
    rentAmount: {
      type: Number,
      required: [true, "Hợp đồng phải có số tiền thuê"],
    },
    depositAmount: {
      type: Number,
      required: [true, "Hợp đồng phải có số tiền đặt cọc"],
    },
    paymentCycle: {
      type: String,
      enum: ["monthly", "quarterly", "biannually", "annually"],
      default: "monthly",
    },
    paymentDueDay: {
      type: Number,
      min: 1,
      max: 31,
      default: 5,
    },
    status: {
      type: String,
      enum: ["pending", "active", "terminated", "expired"],
      default: "pending",
    },
    terminationDate: {
      type: Date,
    },
    terminationReason: {
      type: String,
    },
    terms: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Hợp đồng phải được tạo bởi một người dùng"],
    },
    display_code: {
      type: String,
      unique: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },
    review: {
      type: String,
      default: null,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
contractSchema.index({ tenant: 1 });
contractSchema.index({ room: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ startDate: 1, endDate: 1 });

// Virtual populate
contractSchema.virtual("invoices", {
  ref: "Invoice",
  foreignField: "contract",
  localField: "_id",
});

// Middleware trước khi tìm
contractSchema.pre(/^find/, function (next) {
  this.populate({
    path: "tenant",
    select: "name email",
  }).populate({
    path: "room",
    select: "name roomNumber",
  });
  next();
});

const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;
