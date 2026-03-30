const prisma = require("../utils/prisma");

exports.addStock = async (req, res) => {
    const { itemId, locationId, quantity } = req.body;
    const userId = req.user.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
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

            let remainingStock = quantity;

            // 3. Get All order lines for this item
            const allLines = await tx.orderLine.findMany({
                where: { itemId },
                include: { order: true },
                orderBy: {
                    order: { createdAt: "asc" }, // FIFO 
                },
            });

            // 4. Filter backlog in JS
            const backlogLines = allLines.filter(
                (line) => line.fulfilled < line.quantity
            );

            for (const line of backlogLines) {
                if (remainingStock <= 0) break;

                const need = line.quantity - line.fulfilled;
                const fulfillQty = Math.min(need, remainingStock);

                // 5. Update fulfilled
                await tx.orderLine.update({
                    where: { id: line.id },
                    data: {
                        fulfilled: {
                            increment: fulfillQty,
                        },
                    },
                });

                // 6. Deduct stock
                await tx.itemLocation.update({
                    where: {
                        itemId_locationId: {
                            itemId,
                            locationId,
                        },
                    },
                    data: {
                        quantity: {
                            decrement: fulfillQty,
                        },
                    },
                });

                // 7. Log auto-withdraw
                await tx.log.create({
                    data: {
                        userId,
                        itemId,
                        locationId,
                        quantity: fulfillQty,
                        action: "WITHDRAW",
                    },
                });

                remainingStock -= fulfillQty;

                // 8. Check if order is completed
                const updatedLines = await tx.orderLine.findMany({
                    where: { orderId: line.orderId },
                })

                const isCompleted = updatedLines.every(
                    (l) => l.fulfilled >= l.quantity
                );
                if (isCompleted) {
                    await tx.order.update({
                        where: { id: line.orderId },
                        data: { status: "COMPLETED" },
                    })
                }
            }
            return stock;
        });

        res.json({
            message: "Stock added & backlog processed",
            stock: result,
        });
    } catch (err) {
        console.error("Inbound error", err);
        res.status(500).json({ message: err.message });
    }
}