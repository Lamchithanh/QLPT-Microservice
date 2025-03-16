const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Routes công khai
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// Routes được bảo vệ - yêu cầu đăng nhập
router.use(authMiddleware.protect);

router.get("/me", userController.getCurrentUser);
router.put("/me", userController.updateUser);
router.put("/change-password", userController.changePassword);

// Routes chỉ dành cho admin
router.use(authMiddleware.restrictTo("admin"));

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUserById);
router.delete("/:id", userController.deleteUser);

module.exports = router;
