const express = require("express");
const router = express.Router();
const passwordResetController = require("../controllers/passwordResetController");

// Public routes
router.post("/request", passwordResetController.requestPasswordReset);
router.post("/reset", passwordResetController.resetPassword);

module.exports = router;
