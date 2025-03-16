const express = require("express");
const router = express.Router();
const amenityController = require("../controllers/amenityController");
const authMiddleware = require("../middlewares/authMiddleware");

// Routes công khai
router.get("/", amenityController.getAllAmenities);
router.get("/:id", amenityController.getAmenity);

// Routes được bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes chỉ dành cho admin
router.use(authMiddleware.restrictTo("admin"));

router.post("/", amenityController.createAmenity);
router.put("/:id", amenityController.updateAmenity);
router.delete("/:id", amenityController.deleteAmenity);

module.exports = router;
