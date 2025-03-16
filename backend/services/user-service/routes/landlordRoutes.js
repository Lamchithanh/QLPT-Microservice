const express = require("express");
const router = express.Router();
const landlordController = require("../controllers/landlordController");
const authMiddleware = require("../middlewares/authMiddleware");

// Protected routes
router.use(authMiddleware.protect);

router.post("/register", landlordController.registerLandlord);
router.get("/me", landlordController.getCurrentLandlord);
router.put("/me", landlordController.updateLandlord);

// Admin routes
router.use(authMiddleware.restrictTo("admin"));

router.get("/", landlordController.getLandlords);
router.get("/:id", landlordController.getLandlordById);
router.put("/:id/approve", landlordController.approveLandlord);

module.exports = router;
