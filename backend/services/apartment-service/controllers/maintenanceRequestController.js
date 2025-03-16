const MaintenanceRequest = require("../models/MaintenanceRequest");

// @desc    Tạo yêu cầu bảo trì mới
// @route   POST /api/maintenance
// @access  Private
exports.createMaintenanceRequest = async (req, res) => {
  try {
    // Thêm user ID vào request body
    req.body.user = req.user.id;

    const maintenanceRequest = await MaintenanceRequest.create(req.body);

    res.status(201).json({
      success: true,
      data: maintenanceRequest,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy tất cả các yêu cầu bảo trì
// @route   GET /api/maintenance
// @access  Private (Admin, Landlord)
exports.getAllMaintenanceRequests = async (req, res) => {
  try {
    let query = {};

    // Lọc theo phòng
    if (req.query.room) {
      query.room = req.query.room;
    }

    // Lọc theo trạng thái
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Nếu là tenant, chỉ hiển thị yêu cầu của họ
    if (req.user.role === "tenant") {
      query.user = req.user.id;
    }

    const maintenanceRequests = await MaintenanceRequest.find(query)
      .populate("user", "name email")
      .populate("room", "name roomNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: maintenanceRequests.length,
      data: maintenanceRequests,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy thông tin một yêu cầu bảo trì
// @route   GET /api/maintenance/:id
// @access  Private
exports.getMaintenanceRequest = async (req, res) => {
  try {
    const maintenanceRequest = await MaintenanceRequest.findById(req.params.id)
      .populate("user", "name email")
      .populate("room", "name roomNumber");

    if (!maintenanceRequest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu bảo trì",
      });
    }

    // Kiểm tra quyền truy cập
    if (
      req.user.role === "tenant" &&
      maintenanceRequest.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem yêu cầu này",
      });
    }

    res.status(200).json({
      success: true,
      data: maintenanceRequest,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cập nhật yêu cầu bảo trì
// @route   PUT /api/maintenance/:id
// @access  Private
exports.updateMaintenanceRequest = async (req, res) => {
  try {
    let maintenanceRequest = await MaintenanceRequest.findById(req.params.id);

    if (!maintenanceRequest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu bảo trì",
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role === "tenant") {
      // Tenant chỉ có thể cập nhật yêu cầu của họ và chỉ cập nhật một số trường
      if (maintenanceRequest.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật yêu cầu này",
        });
      }

      // Tenant chỉ có thể cập nhật description và priority
      const allowedUpdates = ["description", "priority"];
      const requestedUpdates = Object.keys(req.body);

      const isValidOperation = requestedUpdates.every((update) =>
        allowedUpdates.includes(update)
      );

      if (!isValidOperation) {
        return res.status(400).json({
          success: false,
          message: "Bạn chỉ có thể cập nhật mô tả và mức độ ưu tiên",
        });
      }
    }

    maintenanceRequest = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      data: maintenanceRequest,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Xóa yêu cầu bảo trì
// @route   DELETE /api/maintenance/:id
// @access  Private (Admin, Landlord)
exports.deleteMaintenanceRequest = async (req, res) => {
  try {
    const maintenanceRequest = await MaintenanceRequest.findById(req.params.id);

    if (!maintenanceRequest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy yêu cầu bảo trì",
      });
    }

    // Chỉ admin và landlord mới có thể xóa
    if (req.user.role !== "admin" && req.user.role !== "landlord") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa yêu cầu này",
      });
    }

    await maintenanceRequest.remove();

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

// @desc    Lấy yêu cầu bảo trì theo phòng
// @route   GET /api/maintenance/room/:roomId
// @access  Private
exports.getRoomMaintenanceRequests = async (req, res) => {
  try {
    let query = { room: req.params.roomId };

    // Nếu là tenant, chỉ hiển thị yêu cầu của họ
    if (req.user.role === "tenant") {
      query.user = req.user.id;
    }

    const maintenanceRequests = await MaintenanceRequest.find(query).populate(
      "user",
      "name email"
    );

    res.status(200).json({
      success: true,
      count: maintenanceRequests.length,
      data: maintenanceRequests,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
