const router = require("express").Router();
const logController = require("../controllers/log.controller");
const auth = require("../middleware/auth.middleware");
const admin = require("../middleware/admin.middleware");

// ONLY ADMIN CAN SEE LOGS
router.get("/", auth, admin, logController.getLogs);


module.exports = router;