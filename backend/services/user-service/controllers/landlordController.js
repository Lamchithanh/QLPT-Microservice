const Landlord = require("../models/Landlord");
const User = require("../models/User");

// @desc    Đăng ký làm chủ trọ
// @route   POST /api/landlords/register
// @access  Private
exports.registerLandlord = async (req, res) => {
  try {
    const { id_card_number, address } = req.body;

    // Kiểm tra xem người dùng đã đăng ký làm chủ trọ chưa
    const existingLandlord = await Landlord.findOne({ user_id: req.user.id });

    if (existingLandlord) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đăng ký làm chủ trọ rồi",
      });
    }

    // Tạo landlord mới
    const landlord = await Landlord.create({
      user_id: req.user.id,
      id_card_number,
      address,
      status: "pending", // Mặc định là pending, chờ admin phê duyệt
    });

    // Cập nhật role của user
    await User.findByIdAndUpdate(req.user.id, { role: "landlord_pending" });

    res.status(201).json({
      success: true,
      data: landlord,
      message: "Đăng ký làm chủ trọ thành công, vui lòng chờ admin phê duyệt",
    });
  } catch (error) {
    console.error("Lỗi đăng ký làm chủ trọ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Lấy thông tin chủ trọ của người dùng hiện tại
// @route   GET /api/landlords/me
// @access  Private
exports.getCurrentLandlord = async (req, res) => {
  try {
    const landlord = await Landlord.findOne({ user_id: req.user.id });

    if (!landlord) {
      return res.status(404).json({
        success: false,
        message: "Bạn chưa đăng ký làm chủ trọ",
      });
    }

    res.status(200).json({
      success: true,
      data: landlord,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin chủ trọ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Cập nhật thông tin chủ trọ
// @route   PUT /api/landlords/me
// @access  Private
exports.updateLandlord = async (req, res) => {
  try {
    const { id_card_number, address } = req.body;

    // Tìm landlord
    const landlord = await Landlord.findOne({ user_id: req.user.id });

    if (!landlord) {
      return res.status(404).json({
        success: false,
        message: "Bạn chưa đăng ký làm chủ trọ",
      });
    }

    // Cập nhật thông tin
    if (id_card_number) landlord.id_card_number = id_card_number;
    if (address) landlord.address = address;

    // Nếu landlord đã bị từ chối, cập nhật lại trạng thái
    if (landlord.status === "rejected") {
      landlord.status = "pending";

      // Cập nhật role của user
      await User.findByIdAndUpdate(req.user.id, { role: "landlord_pending" });
    }

    await landlord.save();

    res.status(200).json({
      success: true,
      data: landlord,
      message: "Cập nhật thông tin chủ trọ thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin chủ trọ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Lấy danh sách chủ trọ (chỉ admin)
// @route   GET /api/landlords
// @access  Private/Admin
exports.getLandlords = async (req, res) => {
  try {
    // Lấy danh sách landlord và populate thông tin user
    const landlords = await Landlord.find().populate({
      path: "user_id",
      select: "username email full_name phone avatar",
    });

    res.status(200).json({
      success: true,
      count: landlords.length,
      data: landlords,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách chủ trọ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Lấy thông tin chủ trọ theo ID (chỉ admin)
// @route   GET /api/landlords/:id
// @access  Private/Admin
exports.getLandlordById = async (req, res) => {
  try {
    const landlord = await Landlord.findById(req.params.id).populate({
      path: "user_id",
      select: "username email full_name phone avatar",
    });

    if (!landlord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chủ trọ",
      });
    }

    res.status(200).json({
      success: true,
      data: landlord,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin chủ trọ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Phê duyệt hoặc từ chối đăng ký chủ trọ (chỉ admin)
// @route   PUT /api/landlords/:id/approve
// @access  Private/Admin
exports.approveLandlord = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' hoặc 'rejected'

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp trạng thái hợp lệ (approved hoặc rejected)",
      });
    }

    const landlord = await Landlord.findById(req.params.id);

    if (!landlord) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chủ trọ",
      });
    }

    // Cập nhật trạng thái
    landlord.status = status;
    await landlord.save();

    // Cập nhật role của user
    const userRole = status === "approved" ? "landlord" : "tenant";
    await User.findByIdAndUpdate(landlord.user_id, { role: userRole });

    res.status(200).json({
      success: true,
      data: landlord,
      message: `Đã ${
        status === "approved" ? "phê duyệt" : "từ chối"
      } đăng ký chủ trọ`,
    });
  } catch (error) {
    console.error("Lỗi phê duyệt chủ trọ:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
