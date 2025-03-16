const mongoose = require("mongoose");

const apartmentSchema = new mongoose.Schema(
  {
    apartmentNumber: {
      type: String,
      required: [true, "Vui lòng nhập số căn hộ"],
      unique: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, "Vui lòng nhập tầng"],
    },
    block: {
      type: String,
      required: [true, "Vui lòng nhập block/tòa nhà"],
      trim: true,
    },
    area: {
      type: Number,
      required: [true, "Vui lòng nhập diện tích"],
    },
    bedrooms: {
      type: Number,
      required: [true, "Vui lòng nhập số phòng ngủ"],
    },
    bathrooms: {
      type: Number,
      required: [true, "Vui lòng nhập số phòng tắm"],
    },
    price: {
      type: Number,
      required: [true, "Vui lòng nhập giá căn hộ"],
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance", "reserved"],
      default: "available",
    },
    description: {
      type: String,
      trim: true,
    },
    images: [String],
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Tạo index cho tìm kiếm
apartmentSchema.index({ apartmentNumber: 1, block: 1 });
apartmentSchema.index({ price: 1, area: 1 });

const Apartment = mongoose.model("Apartment", apartmentSchema);

module.exports = Apartment;
