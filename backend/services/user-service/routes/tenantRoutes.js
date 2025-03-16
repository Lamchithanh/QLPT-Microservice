const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const authMiddleware = require("../middlewares/authMiddleware");

// Protected routes
router.use(authMiddleware.protect);

router.post("/", tenantController.createTenant);
router.get("/me", tenantController.getCurrentTenant);
router.put("/me", tenantController.updateTenant);

// Admin and Landlord routes
router.use(authMiddleware.restrictTo("admin", "landlord"));

router.get("/", tenantController.getTenants);
router.get("/:id", tenantController.getTenantById);

module.exports = router;
