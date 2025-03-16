const Notification = require("../models/Notification");

// @desc    Lấy tất cả thông báo của người dùng hiện tại
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Lấy tổng số thông báo
    const total = await Notification.countDocuments({ user_id: req.user.id });

    // Lấy danh sách thông báo
    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: notifications,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách thông báo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Lấy số lượng thông báo chưa đọc
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user_id: req.user.id,
      is_read: false,
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Lỗi lấy số lượng thông báo chưa đọc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Đánh dấu thông báo đã đọc
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    // Kiểm tra xem thông báo có thuộc về người dùng hiện tại không
    if (notification.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập thông báo này",
      });
    }

    // Đánh dấu đã đọc
    notification.is_read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Lỗi đánh dấu thông báo đã đọc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Đánh dấu tất cả thông báo đã đọc
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, is_read: false },
      { is_read: true }
    );

    res.status(200).json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
    });
  } catch (error) {
    console.error("Lỗi đánh dấu tất cả thông báo đã đọc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Tạo thông báo mới (chỉ admin)
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = async (req, res) => {
  try {
    const { user_id, type, title, content, severity } = req.body;

    const notification = await Notification.create({
      user_id,
      type,
      title,
      content,
      severity: severity || "low",
      is_read: false,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Lỗi tạo thông báo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Xóa thông báo
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    // Kiểm tra xem thông báo có thuộc về người dùng hiện tại không
    if (
      notification.user_id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa thông báo này",
      });
    }

    await notification.remove();

    res.status(200).json({
      success: true,
      message: "Đã xóa thông báo",
    });
  } catch (error) {
    console.error("Lỗi xóa thông báo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
