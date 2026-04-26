const router = require("express").Router();
const logController = require("../controllers/log.controller");
const auth = require("../middleware/auth.middleware");
const adminOrStaff = require("../middleware/admin-or-staff.middleware");

router.get("/", auth, adminOrStaff, logController.getLogs);


module.exports = router;
