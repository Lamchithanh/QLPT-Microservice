const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "paid",
        "overdue",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    description: {
      type: String,
      required: true,
    },
    items: [
      {
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    apartment: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
    },
    payments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],
    paidAt: {
      type: Date,
    },
    metadata: {
      type: Object,
      default: {},
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index cho tìm kiếm nhanh
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ tenant: 1 });
InvoiceSchema.index({ apartment: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });

// Kiểm tra xem model đã tồn tại chưa trước khi tạo mới
module.exports =
  mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
