const mongoose = require("mongoose");

const landlordSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    id_card_number: {
      type: String,
      unique: true,
      required: true,
    },
    address: {
      type: String,
    },
    business_license: {
      type: String,
    },
    property_documents: {
      type: [String],
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
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
landlordSchema.index({ user_id: 1 });
landlordSchema.index({ status: 1 });

const Landlord = mongoose.model("Landlord", landlordSchema);

module.exports = Landlord;
