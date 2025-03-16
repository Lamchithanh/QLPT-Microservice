const mongoose = require("mongoose");

const userFavoriteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },
  deleted_at: {
    type: Date,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for user and room
userFavoriteSchema.index({ user_id: 1, room_id: 1 }, { unique: true });

const UserFavorite = mongoose.model("UserFavorite", userFavoriteSchema);

module.exports = UserFavorite;
