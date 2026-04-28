const prisma = require("../utils/prisma");

async function canResumeOrder(tx, orderId) {
    const lines = await tx.orderLine.findMany({
        where: { orderId }
    });

    const itemIds = [...new Set(lines.map((line) => line.itemId))];
    const stocks = await tx.itemLocation.findMany({
        where: {
            itemId: { in: itemIds },
            quantity: { gt: 0 }
        }
    });

    const stockByItem = stocks.reduce((acc, stock) => {
        acc[stock.itemId] = (acc[stock.itemId] || 0) + stock.quantity;
        return acc;
    }, {});

    return lines.every((line) => {
        const remaining = line.quantity - line.fulfilled;
        return (stockByItem[line.itemId] || 0) >= remaining;
    });
}

// Helper: Get current stock in a location
async function getLocationStock(tx, locationId) {
  const items = await tx.itemLocation.findMany({
    where: { locationId: Number(locationId) }
  });
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

exports.addStock = async (req, res) => {
    const { itemId, locationId, quantity } = req.body;
    const userId = req.user.id;

    if (!itemId || !locationId || quantity <= 0) {
        return res.status(400).json({ message: "itemId, locationId and positive quantity are required"})
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Check location capacity first
            const location = await tx.location.findUnique({
                where: { id: Number(locationId) }
            });
            if (!location) {
                throw new Error("Location not found");
            }

            if (location.capacity !== null) {
                const currentStock = await getLocationStock(tx, Number(locationId));
                const newStock = currentStock + Number(quantity);
                if (newStock > location.capacity) {
                    throw new Error(`Location capacity exceeded. Max: ${location.capacity}, Current: ${currentStock}, Trying to add: ${quantity}`);
                }
            }

            // 1. Add stock
            const stock = await tx.itemLocation.upsert({
                where: {
                    itemId_locationId: {
                        itemId: Number(itemId),
                        locationId: Number(locationId),
                    }
                },
                update: {
                    quantity: { increment: quantity }
                },
                create: {
                    itemId,
                    locationId,
                    quantity,
                }
            });

            // 2. Log inbound
            await tx.log.create({
                data: {
                    userId,
                    itemId,
                    locationId,
                    quantity,
                    action: "ADD",
                },
            });

            // 3. Find affected backlog orders and move them back to pending when stock is sufficient
            const allLines = await tx.orderLine.findMany({
                where: {
                    itemId: Number(itemId),
                    order: {
                        status: "BACKLOG"
                    }
                },
                include: { order: true },
                orderBy: {
                    order: { createdAt: "asc" }, // FIFO 
                },
            });

            const affectedOrderIds = [...new Set(allLines.map((line) => line.orderId))];

            for (const orderId of affectedOrderIds) {
                const resumable = await canResumeOrder(tx, orderId);
                if (resumable) {
                    await tx.order.update({
                        where: { id: orderId },
                        data: { status: "PENDING" },
                    });
                }
            }

            return stock;
        });

        res.json({
            message: "Stock added and backlog queue rechecked",
            stock: result,
        });
    } catch (err) {
        console.error("Inbound error", err);
        res.status(500).json({ message: err.message });
    }
}
