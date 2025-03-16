const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const authMiddleware = require("../middlewares/authMiddleware");

// Routes công khai
router.get("/", roomController.getAllRooms);
router.get("/:id", roomController.getRoom);
router.get("/apartment/:apartmentId", roomController.getRoomsByApartment);

// Routes được bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes chỉ dành cho admin và landlord
router.use(authMiddleware.restrictTo("admin", "landlord"));

router.post("/", roomController.createRoom);
router.put("/:id", roomController.updateRoom);
router.delete("/:id", roomController.deleteRoom);

module.exports = router;
