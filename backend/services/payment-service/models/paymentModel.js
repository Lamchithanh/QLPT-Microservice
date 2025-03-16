const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    apartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["monthly", "deposit", "rent"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "credit_card", "paypal"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    description: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
