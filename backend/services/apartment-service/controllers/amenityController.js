const Amenity = require("../models/Amenity");

// @desc    Tạo tiện ích mới
// @route   POST /api/amenities
// @access  Private (Admin)
exports.createAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.create(req.body);

    res.status(201).json({
      success: true,
      data: amenity,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy tất cả các tiện ích
// @route   GET /api/amenities
// @access  Public
exports.getAllAmenities = async (req, res) => {
  try {
    const amenities = await Amenity.find();

    res.status(200).json({
      success: true,
      count: amenities.length,
      data: amenities,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy thông tin một tiện ích
// @route   GET /api/amenities/:id
// @access  Public
exports.getAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tiện ích",
      });
    }

    res.status(200).json({
      success: true,
      data: amenity,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cập nhật thông tin tiện ích
// @route   PUT /api/amenities/:id
// @access  Private (Admin)
exports.updateAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tiện ích",
      });
    }

    res.status(200).json({
      success: true,
      data: amenity,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Xóa tiện ích
// @route   DELETE /api/amenities/:id
// @access  Private (Admin)
exports.deleteAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tiện ích",
      });
    }

    await amenity.remove();

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
