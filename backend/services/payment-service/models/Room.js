const mongoose = require("mongoose");

/**
 * Schema phòng cho payment-service
 * Lưu ý: Đây là schema tham chiếu, không phải schema chính
 */
const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Phòng phải có tên"],
    },
    roomNumber: {
      type: String,
      required: [true, "Phòng phải có số phòng"],
    },
    price: {
      type: Number,
      required: [true, "Phòng phải có giá"],
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance", "reserved"],
      default: "available",
    },
    apartment: {
      type: mongoose.Schema.ObjectId,
      ref: "Apartment",
      required: [true, "Phòng phải thuộc về một căn hộ"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
