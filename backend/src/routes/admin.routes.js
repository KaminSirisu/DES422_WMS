const router = require("express").Router();
const adminMiddleware = require("../middleware/admin.middleware");
const adminOrStaffMiddleware = require("../middleware/admin-or-staff.middleware");
const authMiddleware = require("../middleware/auth.middleware");
const canOperateWarehouse = require("../middleware/warehouse.middleware");
const admin = require("../controllers/admin.controller");

// ── ITEMS CRUD ─────────────────────────────────────────────
router.get("/items", authMiddleware, adminOrStaffMiddleware, admin.getAllItems);
router.post("/items", authMiddleware, adminMiddleware, admin.createItem);
router.put("/items/:id", authMiddleware, adminMiddleware, admin.updateItem);
router.delete("/items/:id", authMiddleware, adminMiddleware, admin.deleteItem);
router.get("/items/:id/locations", authMiddleware, adminOrStaffMiddleware, admin.getItemLocations);

// ── LOCATIONS CRUD ────────────────────────────────────────
router.get("/locations", authMiddleware, adminOrStaffMiddleware, admin.getAllLocations);
router.post("/locations", authMiddleware, adminMiddleware, admin.createLocation);
router.put("/locations/:id", authMiddleware, adminMiddleware, admin.updateLocation);
router.delete("/locations/:id", authMiddleware, adminMiddleware, admin.deleteLocation);

// ── USERS (admin only) ────────────────────────────────────
router.get("/users", authMiddleware, adminMiddleware, admin.getAllUsers);
router.put("/users/:id", authMiddleware, adminMiddleware, admin.updateUser);
router.delete("/users/:id", authMiddleware, adminMiddleware, admin.deleteUser);
router.put("/users/:id/role", authMiddleware, adminMiddleware, admin.updateUserRole);

// ── ORDERS ────────────────────────────────────────────────
router.get("/orders", authMiddleware, adminOrStaffMiddleware, admin.getAllOrders);
router.put("/orders/:id/status", authMiddleware, adminMiddleware, admin.updateOrderStatus);

// ── TRANSFERS ─────────────────────────────────────────────
router.get("/transfers", authMiddleware, adminOrStaffMiddleware, admin.getAllTransfers);
router.post("/transfers", authMiddleware, canOperateWarehouse, admin.createTransfer);

// ── INVENTORY ADJUSTMENT (admin only) ────────────────────
router.post("/adjust-inventory", authMiddleware, adminMiddleware, admin.adjustInventory);

// ── ALERTS & STATS ────────────────────────────────────────
router.get("/low-stock", authMiddleware, adminOrStaffMiddleware, admin.getLowStockItems);
router.get("/stats", authMiddleware, adminOrStaffMiddleware, admin.getDashboardStats);
router.get("/inventory-overview", authMiddleware, adminOrStaffMiddleware, admin.getInventoryOverview);
router.get("/activity-summary", authMiddleware, adminOrStaffMiddleware, admin.getActivitySummary);
router.get("/reports", authMiddleware, adminMiddleware, admin.getReports);
router.get("/audit-logs", authMiddleware, adminMiddleware, admin.getAuditLogs);
router.get("/settings", authMiddleware, adminMiddleware, admin.getSystemSettings);
router.put("/settings", authMiddleware, adminMiddleware, admin.updateSystemSettings);

// ── MAINTENANCE (admin only) ──────────────────────────────
router.post("/cleanup-zero-quantity", authMiddleware, adminMiddleware, admin.cleanupZeroQuantityRecords);

module.exports = router;
