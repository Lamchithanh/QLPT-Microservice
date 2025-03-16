const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    room_type: {
      type: String,
      enum: ["boarding_house", "mini_apartment", "dormitory", "other"],
      default: "boarding_house",
    },
    title: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    landlord_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Landlord",
    },
    room_number: {
      type: String,
      required: true,
      unique: true,
    },
    floor: {
      type: Number,
    },
    area: {
      type: Number,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discounted_price: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
    description: {
      type: String,
    },
    facilities: {
      type: Map,
      of: Boolean,
      default: {},
    },
    nearby_locations: {
      type: [
        {
          name: String,
          distance: Number,
          type: String,
        },
      ],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    review_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    current_views: {
      type: Number,
      default: 0,
      min: 0,
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
roomSchema.index({ status: 1 });
roomSchema.index({ price: 1 });
roomSchema.index({ floor: 1 });
roomSchema.index({ deleted_at: 1 });
roomSchema.index({ room_type: 1 });
roomSchema.index({ landlord_id: 1 });

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
