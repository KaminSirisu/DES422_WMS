const router = require("express").Router();
const adminMiddleware = require("../middleware/admin.middleware");
const authMiddleware = require("../middleware/auth.middleware");
const admin = require("../controllers/admin.controller");

// only admin can access
router.put("/role", authMiddleware, adminMiddleware, admin.updateUserRole);

module.exports = router;