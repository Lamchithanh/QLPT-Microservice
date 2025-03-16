const mongoose = require("mongoose");

const maintenanceRequestSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    image_urls: {
      type: [String],
      default: [],
    },
    resolved_at: {
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
maintenanceRequestSchema.index({ tenant_id: 1 });
maintenanceRequestSchema.index({ room_id: 1 });
maintenanceRequestSchema.index({ status: 1 });
maintenanceRequestSchema.index({ created_at: 1 });

const MaintenanceRequest = mongoose.model(
  "MaintenanceRequest",
  maintenanceRequestSchema
);

module.exports = MaintenanceRequest;
