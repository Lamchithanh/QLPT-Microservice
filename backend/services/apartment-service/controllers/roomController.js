const Room = require("../models/Room");
const mongoose = require("mongoose");

// @desc    Tạo phòng mới
// @route   POST /api/rooms
// @access  Private (Admin, Landlord)
exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: room,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy tất cả các phòng
// @route   GET /api/rooms
// @access  Public
exports.getAllRooms = async (req, res) => {
  try {
    // Xây dựng query
    let query = {};

    // Lọc theo trạng thái
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Lọc theo apartment
    if (req.query.apartment) {
      query.apartment = req.query.apartment;
    }

    // Lọc theo giá
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Thực hiện query
    const rooms = await Room.find(query)
      .populate("apartment", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy thông tin một phòng
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("apartment", "name address")
      .populate("amenities");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phòng",
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cập nhật thông tin phòng
// @route   PUT /api/rooms/:id
// @access  Private (Admin, Landlord)
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phòng",
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Xóa phòng
// @route   DELETE /api/rooms/:id
// @access  Private (Admin, Landlord)
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phòng",
      });
    }

    await room.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy các phòng theo apartment
// @route   GET /api/rooms/apartment/:apartmentId
// @access  Public
exports.getRoomsByApartment = async (req, res) => {
  try {
    const rooms = await Room.find({
      apartment: req.params.apartmentId,
    }).populate("amenities");

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
