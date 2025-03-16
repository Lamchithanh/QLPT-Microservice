const express = require("express");
const router = express.Router();
const contractController = require("../controllers/contractController");
const authMiddleware = require("../middlewares/authMiddleware");

// Tất cả các routes đều yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes cho tất cả người dùng đã đăng nhập
router.get("/:id", contractController.getContract);

// Routes cho tenant
router.get("/tenant/:tenantId", contractController.getTenantContracts);

// Routes chỉ dành cho admin và landlord
router.use(authMiddleware.restrictTo("admin", "landlord"));

router.post("/", contractController.createContract);
router.get("/", contractController.getAllContracts);
router.put("/:id", contractController.updateContract);
router.get("/room/:roomId", contractController.getRoomContracts);

// Routes chỉ dành cho admin
router.use(authMiddleware.restrictTo("admin"));

router.delete("/:id", contractController.deleteContract);

module.exports = router;
