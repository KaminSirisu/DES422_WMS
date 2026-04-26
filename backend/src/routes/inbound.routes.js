const express = require("express");
const router = express.Router();

const { addStock } = require("../controllers/inbound.controller");
const authMiddleware = require("../middleware/auth.middleware");
const canOperateWarehouse = require("../middleware/warehouse.middleware");

router.post("/", authMiddleware, canOperateWarehouse, addStock);

module.exports = router;
