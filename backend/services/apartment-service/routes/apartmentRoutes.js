const express = require("express");
const apartmentController = require("../controllers/apartmentController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Routes công khai
router.get("/", apartmentController.getAllApartments);
router.get("/:id", apartmentController.getApartment);

// Routes được bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

// Routes chỉ dành cho admin và manager
router.use(authMiddleware.restrictTo("admin", "manager"));

router.post("/", apartmentController.createApartment);
router.patch("/:id", apartmentController.updateApartment);
router.delete("/:id", apartmentController.deleteApartment);

module.exports = router;
