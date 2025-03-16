const express = require("express");
const router = express.Router();
const {
  createPayment,
  updatePaymentStatus,
  getUserPayments,
  getApartmentPayments,
  getAllPayments,
  getPayment,
  getTenantPayments,
  getInvoicePayments,
  deletePayment,
  updatePayment,
} = require("../controllers/paymentController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

// Tất cả các routes đều yêu cầu đăng nhập
router.use(protect);

// Routes cho tất cả người dùng đã đăng nhập
router.post("/", createPayment);
router.get("/user", getUserPayments);

// Routes chỉ dành cho admin và landlord
router.get("/", restrictTo("admin", "landlord"), getAllPayments);
router.get(
  "/apartment/:apartmentId",
  restrictTo("admin", "landlord"),
  getApartmentPayments
);

// Routes với param - phải đặt sau các routes cụ thể hơn
router.get("/tenant/:tenantId", getTenantPayments);
router.get("/invoice/:invoiceId", getInvoicePayments);
router.get("/:id", getPayment);
router.put("/:id", restrictTo("admin", "landlord"), updatePaymentStatus);
router.put("/:id/update", restrictTo("admin", "landlord"), updatePayment);

// Routes chỉ dành cho admin
router.delete("/:id", restrictTo("admin"), deletePayment);

module.exports = router;
