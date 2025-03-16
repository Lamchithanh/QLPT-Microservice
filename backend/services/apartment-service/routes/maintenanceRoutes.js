const express = require("express");
const router = express.Router();
const maintenanceController = require("../controllers/maintenanceRequestController");
const authMiddleware = require("../middlewares/authMiddleware");

// Tất cả các routes đều yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes cho tất cả người dùng đã đăng nhập
router.post("/", maintenanceController.createMaintenanceRequest);
router.get("/:id", maintenanceController.getMaintenanceRequest);
router.put("/:id", maintenanceController.updateMaintenanceRequest);
router.get("/room/:roomId", maintenanceController.getRoomMaintenanceRequests);

// Routes chỉ dành cho admin và landlord
router.use(authMiddleware.restrictTo("admin", "landlord"));

router.get("/", maintenanceController.getAllMaintenanceRequests);
router.delete("/:id", maintenanceController.deleteMaintenanceRequest);

module.exports = router;
