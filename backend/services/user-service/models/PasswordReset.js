const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reset_code: {
    type: String,
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ reset_code: 1 });
passwordResetSchema.index({ expires_at: 1 });

const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);

module.exports = PasswordReset;
