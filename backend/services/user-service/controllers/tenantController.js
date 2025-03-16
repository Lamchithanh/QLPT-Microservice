const Tenant = require("../models/Tenant");
const User = require("../models/User");

// @desc    Tạo thông tin người thuê
// @route   POST /api/tenants
// @access  Private
exports.createTenant = async (req, res) => {
  try {
    const { full_name, id_card_number, permanent_address, phone } = req.body;

    // Kiểm tra xem người dùng đã có thông tin người thuê chưa
    const existingTenant = await Tenant.findOne({ user_id: req.user.id });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã có thông tin người thuê",
      });
    }

    // Tạo thông tin người thuê mới
    const tenant = await Tenant.create({
      user_id: req.user.id,
      full_name: full_name || req.user.full_name,
      id_card_number,
      permanent_address,
      phone: phone || req.user.phone,
    });

    res.status(201).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("Lỗi tạo thông tin người thuê:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Lấy thông tin người thuê của người dùng hiện tại
// @route   GET /api/tenants/me
// @access  Private
exports.getCurrentTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ user_id: req.user.id });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Bạn chưa có thông tin người thuê",
      });
    }

    res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin người thuê:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Cập nhật thông tin người thuê
// @route   PUT /api/tenants/me
// @access  Private
exports.updateTenant = async (req, res) => {
  try {
    const { full_name, id_card_number, permanent_address, phone } = req.body;

    // Tìm thông tin người thuê
    const tenant = await Tenant.findOne({ user_id: req.user.id });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Bạn chưa có thông tin người thuê",
      });
    }

    // Cập nhật thông tin
    if (full_name) tenant.full_name = full_name;
    if (id_card_number) tenant.id_card_number = id_card_number;
    if (permanent_address) tenant.permanent_address = permanent_address;
    if (phone) tenant.phone = phone;

    await tenant.save();

    res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin người thuê:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Lấy danh sách người thuê (chỉ admin và landlord)
// @route   GET /api/tenants
// @access  Private/Admin/Landlord
exports.getTenants = async (req, res) => {
  try {
    // Lấy danh sách tenant và populate thông tin user
    const tenants = await Tenant.find().populate({
      path: "user_id",
      select: "username email full_name phone avatar",
    });

    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách người thuê:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Lấy thông tin người thuê theo ID (chỉ admin và landlord)
// @route   GET /api/tenants/:id
// @access  Private/Admin/Landlord
exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate({
      path: "user_id",
      select: "username email full_name phone avatar",
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người thuê",
      });
    }

    res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin người thuê:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
