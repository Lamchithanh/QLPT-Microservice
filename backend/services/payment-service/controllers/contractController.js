const Contract = require("../models/Contract");

// @desc    Tạo hợp đồng mới
// @route   POST /api/contracts
// @access  Private (Admin, Landlord)
exports.createContract = async (req, res) => {
  try {
    // Thêm người tạo vào request body
    req.body.createdBy = req.user.id;

    const contract = await Contract.create(req.body);

    res.status(201).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy tất cả các hợp đồng
// @route   GET /api/contracts
// @access  Private (Admin, Landlord)
exports.getAllContracts = async (req, res) => {
  try {
    let query = {};

    // Lọc theo trạng thái
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Lọc theo tenant
    if (req.query.tenant) {
      query.tenant = req.query.tenant;
    }

    // Lọc theo phòng
    if (req.query.room) {
      query.room = req.query.room;
    }

    // Nếu là tenant, chỉ hiển thị hợp đồng của họ
    if (req.user.role === "tenant") {
      query.tenant = req.user.id;
    }

    const contracts = await Contract.find(query)
      .populate("tenant", "name email")
      .populate("room", "name roomNumber")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contracts.length,
      data: contracts,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy thông tin một hợp đồng
// @route   GET /api/contracts/:id
// @access  Private
exports.getContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate("tenant", "name email")
      .populate("room", "name roomNumber")
      .populate("createdBy", "name");

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hợp đồng",
      });
    }

    // Kiểm tra quyền truy cập
    if (
      req.user.role === "tenant" &&
      contract.tenant.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem hợp đồng này",
      });
    }

    res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cập nhật hợp đồng
// @route   PUT /api/contracts/:id
// @access  Private (Admin, Landlord)
exports.updateContract = async (req, res) => {
  try {
    // Chỉ admin và landlord mới có thể cập nhật hợp đồng
    if (req.user.role !== "admin" && req.user.role !== "landlord") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật hợp đồng",
      });
    }

    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hợp đồng",
      });
    }

    res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Xóa hợp đồng
// @route   DELETE /api/contracts/:id
// @access  Private (Admin)
exports.deleteContract = async (req, res) => {
  try {
    // Chỉ admin mới có thể xóa hợp đồng
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa hợp đồng",
      });
    }

    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hợp đồng",
      });
    }

    await contract.remove();

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

// @desc    Lấy hợp đồng theo tenant
// @route   GET /api/contracts/tenant/:tenantId
// @access  Private (Admin, Landlord, Owner)
exports.getTenantContracts = async (req, res) => {
  try {
    // Kiểm tra quyền truy cập
    if (req.user.role === "tenant" && req.params.tenantId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem hợp đồng của người khác",
      });
    }

    const contracts = await Contract.find({ tenant: req.params.tenantId })
      .populate("room", "name roomNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contracts.length,
      data: contracts,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy hợp đồng theo phòng
// @route   GET /api/contracts/room/:roomId
// @access  Private (Admin, Landlord)
exports.getRoomContracts = async (req, res) => {
  try {
    // Chỉ admin và landlord mới có thể xem tất cả hợp đồng của một phòng
    if (req.user.role !== "admin" && req.user.role !== "landlord") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem tất cả hợp đồng của phòng này",
      });
    }

    const contracts = await Contract.find({ room: req.params.roomId })
      .populate("tenant", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contracts.length,
      data: contracts,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
