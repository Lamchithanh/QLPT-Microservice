const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middlewares/authMiddleware");

// Routes công khai
router.get("/", reviewController.getAllReviews);
router.get("/:id", reviewController.getReview);
router.get("/room/:roomId", reviewController.getRoomReviews);

// Routes được bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes cho người dùng đã đăng nhập
router.post("/", reviewController.createReview);
router.put("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

module.exports = router;
