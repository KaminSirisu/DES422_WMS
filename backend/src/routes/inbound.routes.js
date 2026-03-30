const express = require("express");
const router = express.Router();

const { addStock } = require("../controllers/inbound.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/admin.middleware");

router.post("/", authMiddleware, isAdmin, addStock);

module.exports = router;