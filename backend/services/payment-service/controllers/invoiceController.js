const Invoice = require("../models/Invoice");
const Contract = require("../models/Contract");

// @desc    Tạo hóa đơn mới
// @route   POST /api/invoices
// @access  Private (Admin, Landlord)
exports.createInvoice = async (req, res) => {
  try {
    // Thêm người tạo vào request body
    req.body.createdBy = req.user.id;

    // Kiểm tra hợp đồng có tồn tại không
    if (req.body.contract) {
      const contract = await Contract.findById(req.body.contract);
      if (!contract) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hợp đồng",
        });
      }

      // Tự động thêm tenant và room từ hợp đồng
      req.body.tenant = contract.tenant;
      req.body.room = contract.room;
    }

    const invoice = await Invoice.create(req.body);

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy tất cả các hóa đơn
// @route   GET /api/invoices
// @access  Private (Admin, Landlord)
exports.getAllInvoices = async (req, res) => {
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

    // Lọc theo hợp đồng
    if (req.query.contract) {
      query.contract = req.query.contract;
    }

    // Nếu là tenant, chỉ hiển thị hóa đơn của họ
    if (req.user.role === "tenant") {
      query.tenant = req.user.id;
    }

    const invoices = await Invoice.find(query)
      .populate("tenant", "name email")
      .populate("room", "name roomNumber")
      .populate("contract", "contractNumber")
      .populate("createdBy", "name")
      .sort({ dueDate: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy thông tin một hóa đơn
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("tenant", "name email")
      .populate("room", "name roomNumber")
      .populate("contract", "contractNumber")
      .populate("createdBy", "name")
      .populate("services.service", "name price");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hóa đơn",
      });
    }

    // Kiểm tra quyền truy cập
    if (
      req.user.role === "tenant" &&
      invoice.tenant.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem hóa đơn này",
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cập nhật hóa đơn
// @route   PUT /api/invoices/:id
// @access  Private (Admin, Landlord)
exports.updateInvoice = async (req, res) => {
  try {
    // Chỉ admin và landlord mới có thể cập nhật hóa đơn
    if (req.user.role !== "admin" && req.user.role !== "landlord") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật hóa đơn",
      });
    }

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hóa đơn",
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Xóa hóa đơn
// @route   DELETE /api/invoices/:id
// @access  Private (Admin)
exports.deleteInvoice = async (req, res) => {
  try {
    // Chỉ admin mới có thể xóa hóa đơn
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa hóa đơn",
      });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hóa đơn",
      });
    }

    await invoice.remove();

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

// @desc    Lấy hóa đơn theo tenant
// @route   GET /api/invoices/tenant/:tenantId
// @access  Private (Admin, Landlord, Owner)
exports.getTenantInvoices = async (req, res) => {
  try {
    // Kiểm tra quyền truy cập
    if (req.user.role === "tenant" && req.params.tenantId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem hóa đơn của người khác",
      });
    }

    const invoices = await Invoice.find({ tenant: req.params.tenantId })
      .populate("room", "name roomNumber")
      .populate("contract", "contractNumber")
      .sort({ dueDate: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy hóa đơn theo phòng
// @route   GET /api/invoices/room/:roomId
// @access  Private (Admin, Landlord)
exports.getRoomInvoices = async (req, res) => {
  try {
    // Chỉ admin và landlord mới có thể xem tất cả hóa đơn của một phòng
    if (req.user.role !== "admin" && req.user.role !== "landlord") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem tất cả hóa đơn của phòng này",
      });
    }

    const invoices = await Invoice.find({ room: req.params.roomId })
      .populate("tenant", "name email")
      .populate("contract", "contractNumber")
      .sort({ dueDate: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy hóa đơn theo hợp đồng
// @route   GET /api/invoices/contract/:contractId
// @access  Private
exports.getContractInvoices = async (req, res) => {
  try {
    // Kiểm tra quyền truy cập
    const contract = await Contract.findById(req.params.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hợp đồng",
      });
    }

    if (
      req.user.role === "tenant" &&
      contract.tenant.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem hóa đơn của hợp đồng này",
      });
    }

    const invoices = await Invoice.find({
      contract: req.params.contractId,
    }).sort({ dueDate: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
