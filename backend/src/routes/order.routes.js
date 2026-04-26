const express = require("express");
const router = express.Router();

const { createOrder, getMyOrders, getPendingPickingOrders, getOrderById, cancelOrder, updateOrderStatus } = require("../controllers/order.controller");
const authMiddleware = require("../middleware/auth.middleware");
const canOperateWarehouse = require("../middleware/warehouse.middleware");

// User endpoints
router.post("/", authMiddleware, createOrder);
router.get("/me", authMiddleware, getMyOrders);
router.get("/picking/pending", authMiddleware, canOperateWarehouse, getPendingPickingOrders);
router.get("/:id", authMiddleware, getOrderById);
router.put("/:id/status", authMiddleware, canOperateWarehouse, updateOrderStatus);
router.put("/:id/cancel", authMiddleware, cancelOrder);

module.exports = router;
