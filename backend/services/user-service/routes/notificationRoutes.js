const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");

// Protected routes
router.use(authMiddleware.protect);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/read-all", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

// Admin routes
router.use(authMiddleware.restrictTo("admin"));

router.post("/", notificationController.createNotification);

module.exports = router;
