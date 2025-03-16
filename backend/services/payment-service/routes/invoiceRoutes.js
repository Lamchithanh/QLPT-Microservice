const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const authMiddleware = require("../middlewares/authMiddleware");

// Tất cả các routes đều yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes cho tất cả người dùng đã đăng nhập
router.get("/:id", invoiceController.getInvoice);
router.get("/tenant/:tenantId", invoiceController.getTenantInvoices);
router.get("/contract/:contractId", invoiceController.getContractInvoices);

// Routes chỉ dành cho admin và landlord
router.use(authMiddleware.restrictTo("admin", "landlord"));

router.post("/", invoiceController.createInvoice);
router.get("/", invoiceController.getAllInvoices);
router.put("/:id", invoiceController.updateInvoice);
router.get("/room/:roomId", invoiceController.getRoomInvoices);

// Routes chỉ dành cho admin
router.use(authMiddleware.restrictTo("admin"));

router.delete("/:id", invoiceController.deleteInvoice);

module.exports = router;
