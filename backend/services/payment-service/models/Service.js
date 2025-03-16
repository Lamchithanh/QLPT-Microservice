const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price_unit: {
      type: String,
    },
    price: {
      type: Number,
    },
    description: {
      type: String,
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

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
