const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");

const ALLOWED_ROLES = ["admin", "staff", "user"];
const ORDER_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "BACKLOG"];

function toInt(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildLocationName({ name, zone, rack, bin }) {
  if (name && String(name).trim()) return String(name).trim();
  const parts = [zone, rack, bin].filter(Boolean).map(v => String(v).trim());
  return parts.length ? parts.join("-") : null;
}

function skuPrefixFromCategory(category) {
  const value = String(category || "").trim().toUpperCase();
  const map = {
    GPU: "GPU",
    CPU: "CPU",
    RAM: "RAM",
    SSD: "SSD",
    HDD: "HDD",
    MOTHERBOARD: "MB",
    PSU: "PSU",
    CASE: "CASE",
    COOLER: "COOL"
  };
  return map[value] || "SKU";
}

async function generateUniqueSku(tx, category) {
  const prefix = skuPrefixFromCategory(category);
  for (let i = 0; i < 8; i += 1) {
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    const candidate = `${prefix}-${Date.now().toString().slice(-6)}-${random}`;
    const existing = await tx.item.findUnique({ where: { sku: candidate } });
    if (!existing) return candidate;
  }
  return `${prefix}-${Date.now()}`;
}

async function ensureSystemSettings(tx = prisma) {
  const existing = await tx.systemSetting.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return tx.systemSetting.create({ data: { id: 1 } });
}

async function createAuditLog(req, action, entityType, entityId, metadata) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req?.user?.id ?? null,
        action,
        entityType,
        entityId: entityId != null ? String(entityId) : null,
        metadata: metadata || null
      }
    });
  } catch {
    // Do not break business flow if audit write fails.
  }
}

// ITEMS
exports.getAllItems = async (req, res) => {
  try {
    const items = await prisma.item.findMany({ orderBy: { createdAt: "desc" } });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createItem = async (req, res) => {
  const { sku, name, category, minStock } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const settings = await ensureSystemSettings();
    const normalizedCategory = category ? String(category).trim() : null;
    const finalSku = sku && String(sku).trim()
      ? String(sku).trim().toUpperCase()
      : await generateUniqueSku(prisma, normalizedCategory);

    const item = await prisma.item.create({
      data: {
        sku: finalSku,
        name: String(name).trim(),
        category: normalizedCategory,
        minStock: minStock !== undefined ? Number(minStock) : settings.defaultReorderPoint
      }
    });

    await createAuditLog(req, "ITEM_CREATE", "ITEM", item.id, {
      sku: item.sku,
      name: item.name,
      category: item.category,
      minStock: item.minStock
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const { sku, name, category, minStock } = req.body;
  try {
    if (sku !== undefined && !String(sku).trim()) {
      return res.status(400).json({ message: "SKU cannot be empty" });
    }
    const before = await prisma.item.findUnique({ where: { id: Number(id) } });
    const item = await prisma.item.update({
      where: { id: Number(id) },
      data: {
        ...(sku !== undefined && { sku: String(sku).trim().toUpperCase() }),
        ...(name !== undefined && { name: String(name).trim() }),
        ...(category !== undefined && { category: category ? String(category).trim() : null }),
        ...(minStock !== undefined && { minStock: Number(minStock) })
      }
    });

    await createAuditLog(req, "ITEM_UPDATE", "ITEM", item.id, { before, after: item });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    const before = await prisma.item.findUnique({ where: { id: Number(id) } });
    await prisma.item.delete({ where: { id: Number(id) } });
    await createAuditLog(req, "ITEM_DELETE", "ITEM", id, { before });
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
      include: { location: true },
      orderBy: { quantity: "desc" }
    });
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOCATIONS
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createLocation = async (req, res) => {
  const { name, zone, rack, bin, capacity } = req.body;
  try {
    const computedName = buildLocationName({ name, zone, rack, bin });
    if (!computedName) {
      return res.status(400).json({ message: "Name or zone/rack/bin is required" });
    }

    const location = await prisma.location.create({
      data: {
        name: computedName,
        zone: zone ? String(zone).trim() : null,
        rack: rack ? String(rack).trim() : null,
        bin: bin ? String(bin).trim() : null,
        capacity: capacity !== undefined && capacity !== "" ? Number(capacity) : null
      }
    });

    await createAuditLog(req, "LOCATION_CREATE", "LOCATION", location.id, { location });
    res.status(201).json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  const { id } = req.params;
  const { name, zone, rack, bin, capacity } = req.body;
  try {
    const before = await prisma.location.findUnique({ where: { id: Number(id) } });
    const hasLocationFields = name !== undefined || zone !== undefined || rack !== undefined || bin !== undefined;
    const computedName = hasLocationFields ? buildLocationName({ name, zone, rack, bin }) : null;

    const location = await prisma.location.update({
      where: { id: Number(id) },
      data: {
        ...(computedName !== null && { name: computedName }),
        ...(zone !== undefined && { zone: zone ? String(zone).trim() : null }),
        ...(rack !== undefined && { rack: rack ? String(rack).trim() : null }),
        ...(bin !== undefined && { bin: bin ? String(bin).trim() : null }),
        ...(capacity !== undefined && { capacity: capacity === "" ? null : Number(capacity) })
      }
    });

    await createAuditLog(req, "LOCATION_UPDATE", "LOCATION", id, { before, after: location });
    res.json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const before = await prisma.location.findUnique({ where: { id: Number(id) } });
    await prisma.location.delete({ where: { id: Number(id) } });
    await createAuditLog(req, "LOCATION_DELETE", "LOCATION", id, { before });
    res.json({ message: "Location deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" }
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
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const before = await prisma.user.findUnique({ where: { id: Number(id) } });
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: { id: true, username: true, email: true, role: true, createdAt: true }
    });
    await createAuditLog(req, "USER_ROLE_UPDATE", "USER", id, { before, after: user });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }
    const normalizedRole = role || "user";
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: String(username).trim(),
        email: String(email).trim(),
        password: hashedPassword,
        role: normalizedRole
      },
      select: { id: true, username: true, email: true, role: true, createdAt: true }
    });

    await createAuditLog(req, "USER_CREATE", "USER", user.id, {
      username: user.username,
      email: user.email,
      role: user.role
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;
  try {
    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const before = await prisma.user.findUnique({ where: { id: Number(id) } });
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(username !== undefined && { username: String(username).trim() }),
        ...(email !== undefined && { email: email ? String(email).trim() : null }),
        ...(role !== undefined && { role })
      },
      select: { id: true, username: true, email: true, role: true, createdAt: true }
    });

    await createAuditLog(req, "USER_UPDATE", "USER", id, { before, after: user });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);
  if (req.user.id === userId) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }
  try {
    const before = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true }
    });
    await prisma.user.delete({ where: { id: userId } });
    await createAuditLog(req, "USER_DELETE", "USER", id, { before });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ORDERS
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { user: { select: { id: true, username: true } }, lines: { include: { item: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const before = await prisma.order.findUnique({ where: { id: Number(id) } });
    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status }
    });
    await createAuditLog(req, "ORDER_STATUS_UPDATE", "ORDER", id, { from: before?.status, to: status });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// TRANSFERS
exports.getAllTransfers = async (req, res) => {
  try {
    const transfers = await prisma.transfer.findMany({
      include: {
        item: true,
        fromLocation: true,
        toLocation: true,
        user: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTransfer = async (req, res) => {
  const { itemId, fromLocationId, toLocationId, quantity } = req.body;
  const userId = req.user.id;

  try {
    if (!itemId || !fromLocationId || !toLocationId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }
    if (Number(fromLocationId) === Number(toLocationId)) {
      return res.status(400).json({ message: "Cannot transfer to the same location" });
    }

    const qty = Number(quantity);
    const result = await prisma.$transaction(async (tx) => {
      const sourceStock = await tx.itemLocation.findUnique({
        where: {
          itemId_locationId: {
            itemId: Number(itemId),
            locationId: Number(fromLocationId)
          }
        }
      });

      if (!sourceStock || sourceStock.quantity < qty) {
        throw new Error("Not enough stock at source location");
      }

      await tx.itemLocation.update({
        where: {
          itemId_locationId: {
            itemId: Number(itemId),
            locationId: Number(fromLocationId)
          }
        },
        data: { quantity: { decrement: qty } }
      });

      await tx.itemLocation.upsert({
        where: {
          itemId_locationId: {
            itemId: Number(itemId),
            locationId: Number(toLocationId)
          }
        },
        update: { quantity: { increment: qty } },
        create: {
          itemId: Number(itemId),
          locationId: Number(toLocationId),
          quantity: qty
        }
      });

      const transfer = await tx.transfer.create({
        data: {
          itemId: Number(itemId),
          fromLocationId: Number(fromLocationId),
          toLocationId: Number(toLocationId),
          userId,
          quantity: qty
        },
        include: { item: true, fromLocation: true, toLocation: true }
      });

      await tx.log.create({
        data: {
          userId,
          itemId: Number(itemId),
          locationId: Number(fromLocationId),
          quantity: qty,
          action: "TRANSFER_OUT"
        }
      });
      await tx.log.create({
        data: {
          userId,
          itemId: Number(itemId),
          locationId: Number(toLocationId),
          quantity: qty,
          action: "TRANSFER_IN"
        }
      });

      return transfer;
    });

    await createAuditLog(req, "TRANSFER_CREATE", "TRANSFER", result.id, {
      itemId: result.itemId,
      fromLocationId: result.fromLocationId,
      toLocationId: result.toLocationId,
      quantity: result.quantity
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// INVENTORY / ACTIVITY / REPORTS
exports.getInventoryOverview = async (req, res) => {
  try {
    const [items, recentLogs] = await Promise.all([
      prisma.item.findMany({
        include: { locations: { include: { location: true } } },
        orderBy: { name: "asc" }
      }),
      prisma.log.findMany({
        take: 300,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { username: true } },
          item: { select: { name: true, sku: true } },
          location: { select: { name: true } }
        }
      })
    ]);

    const inventory = items.map(item => {
      const totalStock = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        minStock: item.minStock,
        totalStock,
        locationCount: item.locations.length,
        locations: item.locations
      };
    });

    res.json({ inventory, recentLogs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActivitySummary = async (req, res) => {
  try {
    const days = Math.max(1, Math.min(90, toInt(req.query.days, 7)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [logs, orders] = await Promise.all([
      prisma.log.findMany({ where: { createdAt: { gte: since } } }),
      prisma.order.findMany({ where: { createdAt: { gte: since } } })
    ]);

    const movement = logs.reduce((acc, log) => {
      const key = log.action;
      acc[key] = (acc[key] || 0) + log.quantity;
      return acc;
    }, {});

    const orderStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      windowDays: days,
      totals: {
        movements: logs.length,
        orders: orders.length
      },
      movement,
      orderStatus
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const [items, logs, orders, audits] = await Promise.all([
      prisma.item.findMany({ include: { locations: true }, orderBy: { name: "asc" } }),
      prisma.log.findMany({
        take: 500,
        include: {
          user: { select: { username: true } },
          item: { select: { name: true, sku: true } },
          location: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.order.findMany({
        include: { user: { select: { username: true } }, lines: true },
        orderBy: { createdAt: "desc" },
        take: 200
      }),
      prisma.auditLog.findMany({
        include: { user: { select: { username: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 300
      })
    ]);

    const stockReport = items.map(item => ({
      itemId: item.id,
      sku: item.sku,
      itemName: item.name,
      category: item.category,
      minStock: item.minStock,
      totalStock: item.locations.reduce((sum, loc) => sum + loc.quantity, 0)
    }));

    const movementReport = logs.map(log => ({
      id: log.id,
      action: log.action,
      quantity: log.quantity,
      reason: log.reason,
      itemName: log.item?.name,
      sku: log.item?.sku,
      locationName: log.location?.name,
      username: log.user?.username,
      createdAt: log.createdAt
    }));

    const orderReport = orders.map(order => ({
      id: order.id,
      status: order.status,
      username: order.user?.username,
      lineCount: order.lines.length,
      totalQty: order.lines.reduce((sum, line) => sum + line.quantity, 0),
      createdAt: order.createdAt
    }));

    res.json({
      stock: stockReport,
      movement: movementReport,
      orders: orderReport,
      audit: audits
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, userId, startDate, endDate } = req.query;
    const audits = await prisma.auditLog.findMany({
      where: {
        ...(action && { action: String(action) }),
        ...(entityType && { entityType: String(entityType) }),
        ...(userId && { userId: Number(userId) }),
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate && { gte: new Date(String(startDate)) }),
                ...(endDate && { lte: new Date(String(endDate)) })
              }
            }
          : {})
      },
      include: { user: { select: { id: true, username: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 1000
    });

    res.json(audits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SYSTEM RULES
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await ensureSystemSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSystemSettings = async (req, res) => {
  const { defaultReorderPoint, lowStockBuffer, allocationStrategy } = req.body;
  try {
    const current = await ensureSystemSettings();
    const next = await prisma.systemSetting.update({
      where: { id: 1 },
      data: {
        ...(defaultReorderPoint !== undefined && { defaultReorderPoint: Number(defaultReorderPoint) }),
        ...(lowStockBuffer !== undefined && { lowStockBuffer: Number(lowStockBuffer) }),
        ...(allocationStrategy && { allocationStrategy })
      }
    });

    await createAuditLog(req, "SYSTEM_SETTINGS_UPDATE", "SYSTEM_SETTING", 1, {
      before: current,
      after: next
    });

    res.json(next);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// LOW STOCK ALERTS / DASHBOARD
exports.getLowStockItems = async (req, res) => {
  try {
    const settings = await ensureSystemSettings();
    const items = await prisma.item.findMany({ include: { locations: true } });
    const lowStockItems = items
      .map(item => {
        const totalStock = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
        return { ...item, totalStock };
      })
      .filter(item => item.totalStock < (item.minStock + settings.lowStockBuffer))
      .sort((a, b) => a.totalStock - b.totalStock);
    res.json(lowStockItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adjustInventory = async (req, res) => {
  const { itemId, locationId, quantity, reason } = req.body;
  const userId = req.user.id;
  try {
    if (!itemId || !locationId || quantity === undefined || !reason) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const qty = Number(quantity);
    const [item, location] = await Promise.all([
      prisma.item.findUnique({ where: { id: Number(itemId) } }),
      prisma.location.findUnique({ where: { id: Number(locationId) } })
    ]);
    if (!item || !location) {
      return res.status(404).json({ message: "Item or location not found" });
    }

    let stock = await prisma.itemLocation.findUnique({
      where: { itemId_locationId: { itemId: Number(itemId), locationId: Number(locationId) } }
    });
    const oldQuantity = stock?.quantity || 0;
    const newQuantity = oldQuantity + qty;
    if (newQuantity < 0) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    if (stock) {
      stock = await prisma.itemLocation.update({
        where: { id: stock.id },
        data: { quantity: newQuantity }
      });
    } else {
      stock = await prisma.itemLocation.create({
        data: { itemId: Number(itemId), locationId: Number(locationId), quantity: newQuantity }
      });
    }

    const action = qty > 0 ? "ADD" : "WITHDRAW";
    await prisma.log.create({
      data: {
        userId,
        itemId: Number(itemId),
        locationId: Number(locationId),
        quantity: Math.abs(qty),
        action,
        reason: String(reason)
      }
    });

    await createAuditLog(req, "INVENTORY_ADJUST", "ITEM_LOCATION", `${itemId}:${locationId}`, {
      itemId: Number(itemId),
      locationId: Number(locationId),
      oldQuantity,
      newQuantity,
      delta: qty,
      reason: String(reason)
    });

    res.json({
      message: "Inventory adjusted",
      stock: { ...stock, oldQuantity, newQuantity, reason: String(reason) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalItems, totalLocations, totalOrders, pendingOrders, backlogOrders] = await Promise.all([
      prisma.item.count(),
      prisma.location.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "BACKLOG" } })
    ]);

    res.json({
      totalItems,
      totalLocations,
      totalOrders,
      pendingOrders: pendingOrders + backlogOrders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
