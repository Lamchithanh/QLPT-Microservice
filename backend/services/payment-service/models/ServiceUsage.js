const mongoose = require("mongoose");

const serviceUsageSchema = new mongoose.Schema(
  {
    contract_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    previous_reading: {
      type: Number,
    },
    current_reading: {
      type: Number,
    },
    usage_amount: {
      type: Number,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
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
serviceUsageSchema.index({ year: 1, month: 1 });
serviceUsageSchema.index({ contract_id: 1 });
serviceUsageSchema.index(
  { contract_id: 1, service_id: 1, year: 1, month: 1 },
  { unique: true }
);

const ServiceUsage = mongoose.model("ServiceUsage", serviceUsageSchema);

module.exports = ServiceUsage;
