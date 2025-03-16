const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    full_name: {
      type: String,
    },
    id_card_number: {
      type: String,
      unique: true,
      sparse: true,
    },
    permanent_address: {
      type: String,
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^\d{10}$/.test(v);
        },
        message: (props) =>
          `${props.value} không phải là số điện thoại hợp lệ!`,
      },
    },
    emergency_contact: {
      type: String,
    },
    avatar: {
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

// Indexes
tenantSchema.index({ phone: 1 });
tenantSchema.index({ id_card_number: 1 });
tenantSchema.index({ status: 1 });

const Tenant = mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;
