const router = require("express").Router();
const item = require("../controllers/item.controller");
const auth = require("../middleware/auth.middleware");
const admin = require("../middleware/admin.middleware");

//router.get("/search", auth, item.searchItems);
router.get("/", auth, item.getAvailableItems);
router.post("/withdraw", auth, admin, item.withdrawItem);

module.exports = router;
