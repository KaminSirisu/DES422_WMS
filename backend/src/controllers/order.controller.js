const prisma = require("../utils/prisma");

exports.createOrder = async (req, res) => {
    const { items } = req.body;
    // items = [{items: 1, quantity: 10}]
    const userId = req.user.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            let orderStatus = "COMPLETED";
            const orderLinesData = [];

            for (const item of items) {
                const { itemId, quantity } = item;

                // 1. Get all stock locations (sorted by quantity DESC or FIFO)
                const stocks = await tx.itemLocation.findMany({
                    where: { itemId },
                    orderBy: { quantity: "desc" }
                })

                let remaining = quantity;
                let fulfilled = 0;

                for (const stock of stocks) {
                    if (remaining <= 0) break;

                    const takeQty = Math.min(stock.quantity, remaining);

                    // 2. Deduct stock
                    await tx.itemLocation.update({
                        where: {
                            itemId_locationId: {
                                itemId,
                                locationId: stock.locationId,
                            },
                        },
                        data: {
                            quantity: {
                                decrement: takeQty
                            }
                        }
                    });

                    // 3. Create log
                    await tx.log.create({
                        data: {
                            userId,
                            itemId,
                            locationId: stock.locationId,
                            quantity: takeQty,
                            action: "WITHDRAW",
                        }
                    });

                    fulfilled += takeQty;
                    remaining -= takeQty;
                }

                // 4. Determine backlog
                if (fulfilled < quantity) {
                    orderStatus = "BACKLOG";
                }

                orderLinesData.push({
                    itemId,
                    quantity,
                    fulfilled,
                })
            }

            // 5. Create order
            const order = await tx.order.create({
                data: {
                    userId,
                    status: orderStatus,
                    lines: {
                        create: orderLinesData,
                    }
                },
                include: {
                    lines: true,
                }
            });

            return order;
        });

        res.json({
            message: "Order created",
            order: result,
        })
    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ message: err.message });
    }
}