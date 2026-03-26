require("dotenv").config();
const express = require("express");
const cors = require("cors");

const logRoutes = require("./routes/log.routes");
const adminRoutes = require("./routes/admin.routes");
const authRoutes = require("./routes/auth.routes");
const itemRoutes = require("./routes/item.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/logs", logRoutes);
app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/items", itemRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
    res.json({status: "ok", message: "Warehouse Management API is running!"});
});