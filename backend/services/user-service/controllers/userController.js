const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Tạo JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Đăng ký người dùng mới
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, phone, full_name, role } = req.body;

    // Kiểm tra xem user đã tồn tại chưa
    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Người dùng đã tồn tại",
      });
    }

    // Tạo user mới
    const user = await User.create({
      username,
      email,
      password,
      phone,
      full_name,
      role: role || "tenant", // Mặc định là tenant
    });

    // Tạo token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Đăng nhập
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kiểm tra xem có nhập username và password không
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập username và password",
      });
    }

    // Tìm user theo username và lấy cả password
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Username hoặc password không đúng",
      });
    }

    // Kiểm tra password
    const isMatch = await user.correctPassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Username hoặc password không đúng",
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (!user.status) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản đã bị khóa",
      });
    }

    // Tạo token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Lấy thông tin người dùng hiện tại
// @route   GET /api/users/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        avatar: user.avatar,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/me
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    const { email, phone, full_name, avatar } = req.body;

    // Tạo đối tượng cập nhật
    const updateData = {};
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (full_name) updateData.full_name = full_name;
    if (avatar) updateData.avatar = avatar;

    // Cập nhật user
    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        avatar: user.avatar,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin người dùng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Đổi mật khẩu
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Kiểm tra xem có nhập đủ thông tin không
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới",
      });
    }

    // Tìm user và lấy cả password
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.correctPassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Lấy danh sách người dùng (chỉ admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ deleted_at: null });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách người dùng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Lấy thông tin người dùng theo ID (chỉ admin)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Cập nhật người dùng (chỉ admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUserById = async (req, res) => {
  try {
    const { email, phone, full_name, role, status } = req.body;

    // Tạo đối tượng cập nhật
    const updateData = {};
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (full_name) updateData.full_name = full_name;
    if (role) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    // Cập nhật user
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Lỗi cập nhật người dùng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// @desc    Xóa người dùng (soft delete)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Soft delete
    user.deleted_at = new Date();
    user.status = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Xóa người dùng thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa người dùng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
