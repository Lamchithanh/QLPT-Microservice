const Review = require("../models/Review");
const Room = require("../models/Room");

// @desc    Tạo đánh giá mới
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    // Thêm user ID vào request body
    req.body.user = req.user.id;

    // Kiểm tra xem user đã đánh giá phòng này chưa
    const existingReview = await Review.findOne({
      user: req.user.id,
      room: req.body.room,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá phòng này rồi",
      });
    }

    const review = await Review.create(req.body);

    // Cập nhật rating trung bình của phòng
    await updateRoomRating(req.body.room);

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy tất cả các đánh giá
// @route   GET /api/reviews
// @access  Public
exports.getAllReviews = async (req, res) => {
  try {
    let query = {};

    // Lọc theo phòng
    if (req.query.room) {
      query.room = req.query.room;
    }

    // Lọc theo user
    if (req.query.user) {
      query.user = req.query.user;
    }

    const reviews = await Review.find(query)
      .populate("user", "name avatar")
      .populate("room", "name");

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy thông tin một đánh giá
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("user", "name avatar")
      .populate("room", "name");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cập nhật đánh giá
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // Đảm bảo user là người tạo đánh giá hoặc admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Bạn không có quyền cập nhật đánh giá này",
      });
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Cập nhật rating trung bình của phòng
    await updateRoomRating(review.room);

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Xóa đánh giá
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // Đảm bảo user là người tạo đánh giá hoặc admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "Bạn không có quyền xóa đánh giá này",
      });
    }

    const roomId = review.room;

    await review.remove();

    // Cập nhật rating trung bình của phòng
    await updateRoomRating(roomId);

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

// @desc    Lấy đánh giá của phòng
// @route   GET /api/reviews/room/:roomId
// @access  Public
exports.getRoomReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ room: req.params.roomId }).populate(
      "user",
      "name avatar"
    );

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Hàm hỗ trợ để cập nhật rating trung bình của phòng
async function updateRoomRating(roomId) {
  const stats = await Review.aggregate([
    {
      $match: { room: roomId },
    },
    {
      $group: {
        _id: "$room",
        avgRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Room.findByIdAndUpdate(roomId, {
      averageRating: stats[0].avgRating,
      numReviews: stats[0].numReviews,
    });
  } else {
    await Room.findByIdAndUpdate(roomId, {
      averageRating: 0,
      numReviews: 0,
    });
  }
}
