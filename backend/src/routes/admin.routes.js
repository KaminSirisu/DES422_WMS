const router = require("express").Router();
const adminMiddleware = require("../middleware/admin.middleware");
const authMiddleware = require("../middleware/auth.middleware");
const canOperateWarehouse = require("../middleware/warehouse.middleware");
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
router.post("/users", authMiddleware, adminMiddleware, admin.createUser);
router.put("/users/:id", authMiddleware, adminMiddleware, admin.updateUser);
router.delete("/users/:id", authMiddleware, adminMiddleware, admin.deleteUser);
router.put("/users/:id/role", authMiddleware, adminMiddleware, admin.updateUserRole);

// ── ORDERS (admin only) ───────────────────────────────────
router.get("/orders", authMiddleware, adminMiddleware, admin.getAllOrders);
router.put("/orders/:id/status", authMiddleware, adminMiddleware, admin.updateOrderStatus);

// ── TRANSFERS (admin only) ───────────────────────────────
router.get("/transfers", authMiddleware, canOperateWarehouse, admin.getAllTransfers);
router.post("/transfers", authMiddleware, canOperateWarehouse, admin.createTransfer);

// ── INVENTORY ADJUSTMENT (admin only) ────────────────────
router.post("/adjust-inventory", authMiddleware, adminMiddleware, admin.adjustInventory);

// ── ALERTS & STATS (admin only) ───────────────────────────
router.get("/low-stock", authMiddleware, adminMiddleware, admin.getLowStockItems);
router.get("/stats", authMiddleware, adminMiddleware, admin.getDashboardStats);
router.get("/inventory-overview", authMiddleware, adminMiddleware, admin.getInventoryOverview);
router.get("/activity-summary", authMiddleware, adminMiddleware, admin.getActivitySummary);
router.get("/reports", authMiddleware, adminMiddleware, admin.getReports);
router.get("/audit-logs", authMiddleware, adminMiddleware, admin.getAuditLogs);
router.get("/settings", authMiddleware, adminMiddleware, admin.getSystemSettings);
router.put("/settings", authMiddleware, adminMiddleware, admin.updateSystemSettings);

module.exports = router;
