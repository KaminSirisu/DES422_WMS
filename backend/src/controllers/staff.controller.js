const prisma = require("../utils/prisma");

async function createAuditLog(userId, action, entityType, entityId, metadata) {
  try {
    if (typeof prisma.auditLog?.create !== "function") return;
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId != null ? String(entityId) : null,
        metadata: metadata || null,
      },
    });
  } catch {
    // Do not block staff workflows on audit failures.
  }
}

exports.cycleCount = async (req, res) => {
  const { itemId, locationId, countedQuantity, note } = req.body;
  const userId = req.user.id;

  if (!itemId || !locationId || countedQuantity === undefined || Number(countedQuantity) < 0) {
    return res.status(400).json({ message: "itemId, locationId and non-negative countedQuantity are required" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [item, location, stock] = await Promise.all([
        tx.item.findUnique({ where: { id: Number(itemId) } }),
        tx.location.findUnique({ where: { id: Number(locationId) } }),
        tx.itemLocation.findUnique({
          where: {
            itemId_locationId: {
              itemId: Number(itemId),
              locationId: Number(locationId),
            },
          },
        }),
      ]);

      if (!item || !location) {
        throw new Error("Item or location not found");
      }

      const oldQuantity = stock?.quantity || 0;
      const newQuantity = Number(countedQuantity);
      const delta = newQuantity - oldQuantity;

      const updatedStock = stock
        ? await tx.itemLocation.update({
            where: { id: stock.id },
            data: { quantity: newQuantity },
          })
        : await tx.itemLocation.create({
            data: {
              itemId: Number(itemId),
              locationId: Number(locationId),
              quantity: newQuantity,
            },
          });

      if (delta !== 0) {
        await tx.log.create({
          data: {
            userId,
            itemId: Number(itemId),
            locationId: Number(locationId),
            quantity: Math.abs(delta),
            action: delta > 0 ? "ADD" : "WITHDRAW",
            reason: `Cycle count${note ? `: ${String(note).trim()}` : ""}`,
          },
        });
      }

      return {
        stock: updatedStock,
        item,
        location,
        oldQuantity,
        newQuantity,
        delta,
      };
    });

    await createAuditLog(userId, "CYCLE_COUNT", "ITEM_LOCATION", `${itemId}:${locationId}`, {
      itemId: Number(itemId),
      locationId: Number(locationId),
      oldQuantity: result.oldQuantity,
      newQuantity: result.newQuantity,
      delta: result.delta,
      note: note ? String(note).trim() : null,
    });

    res.json({
      message: "Cycle count recorded",
      ...result,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.reportIssue = async (req, res) => {
  const { itemId, locationId, issueType, quantity, description } = req.body;
  const userId = req.user.id;

  if (!issueType || !String(issueType).trim()) {
    return res.status(400).json({ message: "issueType is required" });
  }

  try {
    const [item, location] = await Promise.all([
      itemId ? prisma.item.findUnique({ where: { id: Number(itemId) } }) : Promise.resolve(null),
      locationId ? prisma.location.findUnique({ where: { id: Number(locationId) } }) : Promise.resolve(null),
    ]);

    await createAuditLog(userId, "ISSUE_REPORTED", "WAREHOUSE_ISSUE", null, {
      issueType: String(issueType).trim(),
      quantity: quantity !== undefined && quantity !== "" ? Number(quantity) : null,
      description: description ? String(description).trim() : null,
      itemId: item ? item.id : null,
      itemName: item ? item.name : null,
      locationId: location ? location.id : null,
      locationName: location ? location.name : null,
    });

    res.status(201).json({
      message: "Issue reported successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
