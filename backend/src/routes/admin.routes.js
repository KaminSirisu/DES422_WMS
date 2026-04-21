const router = require("express").Router();
const adminMiddleware = require("../middleware/admin.middleware");
const authMiddleware = require("../middleware/auth.middleware");
const admin = require("../controllers/admin.controller");

// ── ITEMS CRUD (admin only) ───────────────────────────────
router.get("/items", authMiddleware, adminMiddleware, admin.getAllItems);
router.post("/items", authMiddleware, adminMiddleware, admin.createItem);
router.put("/items/:id", authMiddleware, adminMiddleware, admin.updateItem);
router.delete("/items/:id", authMiddleware, adminMiddleware, admin.deleteItem);
router.get("/items/:id/locations", authMiddleware, adminMiddleware, admin.getItemLocations);

// ── LOCATIONS CRUD (admin only) ───────────────────────────
router.get("/locations", authMiddleware, adminMiddleware, admin.getAllLocations);
router.post("/locations", authMiddleware, adminMiddleware, admin.createLocation);
router.put("/locations/:id", authMiddleware, adminMiddleware, admin.updateLocation);
router.delete("/locations/:id", authMiddleware, adminMiddleware, admin.deleteLocation);

// ── USERS (admin only) ────────────────────────────────────
router.get("/users", authMiddleware, adminMiddleware, admin.getAllUsers);
router.put("/users/:id/role", authMiddleware, adminMiddleware, admin.updateUserRole);

// ── ORDERS (admin only) ───────────────────────────────────
router.get("/orders", authMiddleware, adminMiddleware, admin.getAllOrders);
router.put("/orders/:id/status", authMiddleware, adminMiddleware, admin.updateOrderStatus);

module.exports = router;