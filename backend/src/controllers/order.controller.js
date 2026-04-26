const prisma = require("../utils/prisma");

exports.createOrder = async (req, res) => {
    const { items } = req.body;
    // items = [{items: 1, quantity: 10}]
    const userId = req.user.id;

    try {
        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        const allocationStrategy = settings?.allocationStrategy || "FIFO";
        const stockOrderBy = allocationStrategy === "LIFO" ? { id: "desc" } : { id: "asc" };

        const result = await prisma.$transaction(async (tx) => {
            let orderStatus = "COMPLETED";
            const orderLinesData = [];

            for (const item of items) {
                const { itemId, quantity } = item;

                // 1. Get all stock locations (sorted by quantity DESC or FIFO)
                const stocks = await tx.itemLocation.findMany({
                    where: { itemId },
                    orderBy: stockOrderBy
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

        await prisma.auditLog.create({
            data: {
                userId,
                action: "ORDER_CREATE",
                entityType: "ORDER",
                entityId: String(result.id),
                metadata: {
                    status: result.status,
                    lineCount: result.lines.length,
                    allocationStrategy
                }
            }
        });

        res.json({
            message: "Order created",
            order: result,
        })
    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({ message: err.message });
    }
};

// GET /orders/me - ดู order ของตัวเอง
exports.getMyOrders = async (req, res) => {
    const userId = req.user.id;
    try {
        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                lines: {
                    include: { item: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /orders/picking/pending - ดู orders ที่ต้อง pick (สำหรับ warehouse staff)
exports.getPendingPickingOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ['PENDING', 'BACKLOG', 'PROCESSING'] }
            },
            include: {
                user: { select: { id: true, username: true } },
                lines: {
                    include: { item: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /orders/:id/status - อัพเดต order status (PROCESSING, COMPLETED)
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PROCESSING', 'COMPLETED'];
    try {
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const order = await prisma.order.update({
            where: { id: Number(id) },
            data: { status },
            include: {
                lines: { include: { item: true } },
                user: { select: { username: true } }
            }
        });

        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: "ORDER_STATUS_UPDATE",
                entityType: "ORDER",
                entityId: String(id),
                metadata: { status }
            }
        });

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /orders/:id - ดู order detail
exports.getOrderById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const order = await prisma.order.findUnique({
            where: { id: Number(id) },
            include: {
                user: { select: { id: true, username: true } },
                lines: {
                    include: { item: true }
                }
            }
        });
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        // User can only view their own orders, admin can view all
        if (order.userId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }
        
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /orders/:id/cancel - ยกเลิก order
exports.cancelOrder = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    try {
        const order = await prisma.order.findUnique({
            where: { id: Number(id) }
        });
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        // User can only cancel their own orders
        if (order.userId !== userId) {
            return res.status(403).json({ message: "Access denied" });
        }
        
        // Can only cancel PENDING or BACKLOG orders
        if (order.status !== 'PENDING' && order.status !== 'BACKLOG') {
            return res.status(400).json({ message: "Cannot cancel this order" });
        }
        
        // Restore stock for fulfilled items
        const lines = await prisma.orderLine.findMany({
            where: { orderId: Number(id) }
        });
        
        await prisma.$transaction(async (tx) => {
            for (const line of lines) {
                if (line.fulfilled > 0) {
                    // Get all locations with this item
                    const stocks = await tx.itemLocation.findMany({
                        where: { itemId: line.itemId }
                    });
                    
                    let remaining = line.fulfilled;
                    
                    // Add stock back to existing locations
                    for (const stock of stocks) {
                        if (remaining <= 0) break;
                        await tx.itemLocation.update({
                            where: { id: stock.id },
                            data: { quantity: { increment: Math.min(stock.quantity, remaining) } }
                        });
                        remaining -= Math.min(stock.quantity, remaining);
                    }
                    
                    // Create remaining in first location or create new
                    if (remaining > 0) {
                        const firstLoc = stocks[0];
                        if (firstLoc) {
                            await tx.itemLocation.update({
                                where: { id: firstLoc.id },
                                data: { quantity: { increment: remaining } }
                            });
                        }
                    }
                    
                    // Log the restoration
                    await tx.log.create({
                        data: {
                            userId,
                            itemId: line.itemId,
                            locationId: stocks[0]?.locationId || 1,
                            quantity: line.fulfilled,
                            action: "ADD",
                        }
                    });
                }
            }
            
            // Update order status to CANCELLED
            await tx.order.update({
                where: { id: Number(id) },
                data: { status: "CANCELLED" }
            });
        });

        await prisma.auditLog.create({
            data: {
                userId,
                action: "ORDER_CANCEL",
                entityType: "ORDER",
                entityId: String(id),
                metadata: { reason: "User cancelled pending/backlog order" }
            }
        });
        
        res.json({ message: "Order cancelled successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
