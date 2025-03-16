const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["contract", "payment", "maintenance", "room", "general"],
      default: "general",
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    related_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "onModel",
    },
    onModel: {
      type: String,
      enum: ["Contract", "Invoice", "MaintenanceRequest", "Room"],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "low",
    },
    expires_at: {
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
notificationSchema.index({ user_id: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ is_read: 1 });
notificationSchema.index({ created_at: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
