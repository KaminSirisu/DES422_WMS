const prisma = require("../utils/prisma");

// ── ITEMS ─────────────────────────────────────────────────
exports.getAllItems = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createItem = async (req, res) => {
  const { name, minStock } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    const item = await prisma.item.create({
      data: { name, minStock: minStock || 10 }
    });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const { name, minStock } = req.body;
  try {
    const item = await prisma.item.update({
      where: { id: Number(id) },
      data: { ...(name && { name }), ...(minStock !== undefined && { minStock }) }
    });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.item.delete({ where: { id: Number(id) } });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getItemLocations = async (req, res) => {
  const { id } = req.params;
  try {
    const stocks = await prisma.itemLocation.findMany({
      where: { itemId: Number(id) },
      include: { location: true }
    });
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── LOCATIONS ─────────────────────────────────────────────
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createLocation = async (req, res) => {
  const { name, capacity } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    const location = await prisma.location.create({
      data: { name, capacity: capacity || null }
    });
    res.json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  const { id } = req.params;
  const { name, capacity } = req.body;
  try {
    const location = await prisma.location.update({
      where: { id: Number(id) },
      data: { ...(name && { name }), ...(capacity !== undefined && { capacity }) }
    });
    res.json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteLocation = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.location.delete({ where: { id: Number(id) } });
    res.json({ message: "Location deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── USERS ─────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── ORDERS ─────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { user: { select: { id: true, username: true } }, lines: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "BACKLOG"];
  try {
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};