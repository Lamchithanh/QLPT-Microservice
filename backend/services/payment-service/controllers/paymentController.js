const Payment = require("../models/Payment");
const axios = require("axios");
const Invoice = require("../models/Invoice");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// @desc    Tạo thanh toán mới
// @route   POST /api/payments
// @access  Private - Admin, Landlord, Tenant
exports.createPayment = catchAsync(async (req, res, next) => {
  // Thêm người tạo vào request body
  req.body.createdBy = req.user.id;

  // Kiểm tra hóa đơn tồn tại
  const invoice = await Invoice.findById(req.body.invoice);
  if (!invoice) {
    return next(new AppError("Không tìm thấy hóa đơn với ID này", 404));
  }

  // Kiểm tra quyền truy cập
  if (req.user.role === "tenant" && invoice.tenant.toString() !== req.user.id) {
    return next(new AppError("Bạn không có quyền thanh toán hóa đơn này", 403));
  }

  // Kiểm tra trạng thái hóa đơn
  if (invoice.status === "paid") {
    return next(new AppError("Hóa đơn này đã được thanh toán", 400));
  }

  // Tạo thanh toán
  const payment = await Payment.create(req.body);

  // Cập nhật trạng thái hóa đơn nếu thanh toán thành công
  if (payment.status === "success") {
    invoice.status = "paid";
    invoice.paymentDate = Date.now();
    await invoice.save();
  }

  res.status(201).json({
    status: "success",
    data: {
      payment,
    },
  });
});

// @desc    Cập nhật trạng thái thanh toán
// @route   PUT /api/payments/:id
// @access  Private/Admin
exports.updatePaymentStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return next(new AppError("Không tìm thấy thanh toán với ID này", 404));
  }

  // Kiểm tra quyền truy cập
  if (req.user.role !== "admin" && req.user.role !== "landlord") {
    return next(
      new AppError("Bạn không có quyền cập nhật trạng thái thanh toán", 403)
    );
  }

  payment.status = status;
  await payment.save();

  // Cập nhật trạng thái hóa đơn nếu thanh toán thành công
  if (status === "success") {
    const invoice = await Invoice.findById(payment.invoice);
    if (invoice && invoice.status !== "paid") {
      invoice.status = "paid";
      invoice.paymentDate = Date.now();
      await invoice.save();
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      payment,
    },
  });
});

// @desc    Lấy tất cả thanh toán của người dùng
// @route   GET /api/payments/user
// @access  Private
exports.getUserPayments = catchAsync(async (req, res, next) => {
  const payments = await Payment.find({ tenant: req.user.id })
    .populate("invoice", "amount dueDate")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: {
      payments,
    },
  });
});

// @desc    Lấy tất cả thanh toán của một phòng trọ
// @route   GET /api/payments/apartment/:apartmentId
// @access  Private
exports.getApartmentPayments = catchAsync(async (req, res, next) => {
  // Kiểm tra quyền truy cập
  if (req.user.role !== "admin" && req.user.role !== "landlord") {
    return next(
      new AppError("Bạn không có quyền xem thanh toán của căn hộ này", 403)
    );
  }

  const payments = await Payment.find({
    "invoice.room.apartment": req.params.apartmentId,
  })
    .populate("invoice", "amount dueDate")
    .populate("tenant", "name email")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: {
      payments,
    },
  });
});

// @desc    Lấy tất cả thanh toán (chỉ admin)
// @route   GET /api/payments
// @access  Private - Admin, Landlord
exports.getAllPayments = catchAsync(async (req, res, next) => {
  // Lọc theo trạng thái, tenant, invoice nếu có
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.tenant) filter.tenant = req.query.tenant;
  if (req.query.invoice) filter.invoice = req.query.invoice;

  // Nếu là tenant, chỉ hiển thị thanh toán của họ
  if (req.user.role === "tenant") {
    filter.tenant = req.user.id;
  }

  const payments = await Payment.find(filter)
    .populate("invoice", "amount dueDate")
    .populate("tenant", "name email");

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: {
      payments,
    },
  });
});

/**
 * Lấy thông tin thanh toán theo ID
 * @route GET /api/payments/:id
 * @access Private
 */
exports.getPayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate("invoice", "amount dueDate")
    .populate("tenant", "name email");

  if (!payment) {
    return next(new AppError("Không tìm thấy thanh toán với ID này", 404));
  }

  // Kiểm tra quyền truy cập
  if (req.user.role === "tenant" && payment.tenant.toString() !== req.user.id) {
    return next(new AppError("Bạn không có quyền xem thanh toán này", 403));
  }

  res.status(200).json({
    status: "success",
    data: {
      payment,
    },
  });
});

/**
 * Cập nhật thanh toán
 * @route PUT /api/payments/:id
 * @access Private - Admin, Landlord
 */
exports.updatePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!payment) {
    return next(new AppError("Không tìm thấy thanh toán với ID này", 404));
  }

  // Nếu cập nhật trạng thái thanh toán thành công, cập nhật trạng thái hóa đơn
  if (req.body.status === "success") {
    const invoice = await Invoice.findById(payment.invoice);
    if (invoice && invoice.status !== "paid") {
      invoice.status = "paid";
      invoice.paymentDate = Date.now();
      await invoice.save();
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      payment,
    },
  });
});

/**
 * Xóa thanh toán
 * @route DELETE /api/payments/:id
 * @access Private - Admin
 */
exports.deletePayment = catchAsync(async (req, res, next) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);

  if (!payment) {
    return next(new AppError("Không tìm thấy thanh toán với ID này", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Lấy thanh toán của tenant
 * @route GET /api/payments/tenant/:tenantId
 * @access Private
 */
exports.getTenantPayments = catchAsync(async (req, res, next) => {
  const tenantId = req.params.tenantId;

  // Nếu là tenant, chỉ cho phép xem thanh toán của chính họ
  if (req.user.role === "tenant" && tenantId !== req.user.id) {
    return next(
      new AppError("Bạn không có quyền xem thanh toán của người khác", 403)
    );
  }

  const payments = await Payment.find({ tenant: tenantId })
    .populate("invoice", "amount dueDate")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: {
      payments,
    },
  });
});

/**
 * Lấy thanh toán của hóa đơn
 * @route GET /api/payments/invoice/:invoiceId
 * @access Private
 */
exports.getInvoicePayments = catchAsync(async (req, res, next) => {
  const invoiceId = req.params.invoiceId;

  // Kiểm tra hóa đơn tồn tại
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return next(new AppError("Không tìm thấy hóa đơn với ID này", 404));
  }

  // Kiểm tra quyền truy cập
  if (req.user.role === "tenant" && invoice.tenant.toString() !== req.user.id) {
    return next(
      new AppError("Bạn không có quyền xem thanh toán của hóa đơn này", 403)
    );
  }

  const payments = await Payment.find({ invoice: invoiceId }).sort(
    "-createdAt"
  );

  res.status(200).json({
    status: "success",
    results: payments.length,
    data: {
      payments,
    },
  });
});
