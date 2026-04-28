require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const logRoutes = require("./routes/log.routes");
const adminRoutes = require("./routes/admin.routes");
const authRoutes = require("./routes/auth.routes");
const itemRoutes = require("./routes/item.routes");
const orderRoutes = require("./routes/order.routes");
const inboundRoutes = require("./routes/inbound.routes");
const staffRoutes = require("./routes/staff.routes");

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/logs", logRoutes);
app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/items", itemRoutes);

app.use("/orders", orderRoutes);
app.use("/inbound", inboundRoutes);
app.use("/staff", staffRoutes);

const PORT = 3000;

// Auto-cleanup: Remove ItemLocation records with quantity = 0 on startup
async function cleanupZeroQuantityOnStartup() {
  try {
    const deleted = await prisma.itemLocation.deleteMany({
      where: { quantity: 0 }
    });
    if (deleted.count > 0) {
      console.log(`🧹 Cleaned up ${deleted.count} orphaned zero-quantity inventory records`);
    }
  } catch (err) {
    console.error("Cleanup error:", err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await cleanupZeroQuantityOnStartup();
});

app.get("/", (req, res) => {
    res.json({status: "ok", message: "Warehouse Management API is running!"});
});
