const router = require("express").Router();
const authMiddleware = require("../middleware/auth.middleware");
const canOperateWarehouse = require("../middleware/warehouse.middleware");
const staff = require("../controllers/staff.controller");

router.post("/cycle-count", authMiddleware, canOperateWarehouse, staff.cycleCount);
router.post("/issues", authMiddleware, canOperateWarehouse, staff.reportIssue);

module.exports = router;
