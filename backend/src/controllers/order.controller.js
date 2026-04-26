const prisma = require("../utils/prisma");

async function getAllocationStrategy() {
    try {
        if (typeof prisma.systemSetting?.findUnique !== "function") {
            return "FIFO";
        }

        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        return settings?.allocationStrategy || "FIFO";
    } catch {
        return "FIFO";
    }
}

async function createOrderAuditLog(userId, orderId, metadata) {
    try {
        if (typeof prisma.auditLog?.create !== "function") {
            return;
        }

        await prisma.auditLog.create({
            data: {
                userId,
                action: "ORDER_CREATE",
                entityType: "ORDER",
                entityId: String(orderId),
                metadata
            }
        });
    } catch {
        // Do not block order creation if audit logging is unavailable.
    }
}

async function allocateOrderStock(tx, order, userId, stockOrderBy) {
    for (const line of order.lines) {
        const remaining = line.quantity - line.fulfilled;
        if (remaining <= 0) continue;

        const stocks = await tx.itemLocation.findMany({
            where: {
                itemId: line.itemId,
                quantity: { gt: 0 }
            },
            orderBy: stockOrderBy
        });

        let qtyToAllocate = remaining;

        for (const stock of stocks) {
            if (qtyToAllocate <= 0) break;

            const takeQty = Math.min(stock.quantity, qtyToAllocate);

            await tx.itemLocation.update({
                where: {
                    itemId_locationId: {
                        itemId: line.itemId,
                        locationId: stock.locationId,
                    },
                },
                data: {
                    quantity: {
                        decrement: takeQty
                    }
                }
            });

            await tx.log.create({
                data: {
                    userId,
                    itemId: line.itemId,
                    locationId: stock.locationId,
                    quantity: takeQty,
                    action: "WITHDRAW",
                }
            });

            await tx.orderLine.update({
                where: { id: line.id },
                data: {
                    fulfilled: {
                        increment: takeQty
                    }
                }
            });

            qtyToAllocate -= takeQty;
        }
    }
}

async function hasEnoughStockForRemaining(tx, order) {
    for (const line of order.lines) {
        const remaining = line.quantity - line.fulfilled;
        if (remaining <= 0) continue;

        const stocks = await tx.itemLocation.findMany({
            where: {
                itemId: line.itemId,
                quantity: { gt: 0 }
            },
            select: { quantity: true }
        });

        const totalAvailable = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
        if (totalAvailable < remaining) {
            return false;
        }
    }

    return true;
}

async function reconcileBacklogOrder(tx, order) {
    if (order.status !== "BACKLOG") return order.status;

    const isFullyAllocated = order.lines.every((line) => line.fulfilled >= line.quantity);
    const hasStockNow = isFullyAllocated || await hasEnoughStockForRemaining(tx, order);

    if (!hasStockNow) return order.status;

    await tx.order.update({
        where: { id: order.id },
        data: { status: "PENDING" }
    });

    return "PENDING";
}

async function attachAvailableStock(tx, order) {
    const itemIds = [...new Set(order.lines.map((line) => line.itemId))];
    const stocks = await tx.itemLocation.findMany({
        where: {
            itemId: { in: itemIds }
        },
        select: {
            itemId: true,
            quantity: true
        }
    });

    const availableByItem = stocks.reduce((acc, stock) => {
        acc[stock.itemId] = (acc[stock.itemId] || 0) + stock.quantity;
        return acc;
    }, {});

    return {
        ...order,
        lines: order.lines.map((line) => ({
            ...line,
            availableStock: availableByItem[line.itemId] || 0
        }))
    };
}

function getRemainingShortage(lines) {
    return lines
        .filter((line) => line.fulfilled < line.quantity)
        .map((line) => ({
            itemId: line.itemId,
            itemName: line.item?.name || `Item #${line.itemId}`,
            remaining: line.quantity - line.fulfilled
        }));
}

exports.createOrder = async (req, res) => {
    const { items } = req.body;
    const userId = req.user.id;

    try {
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "At least one order item is required" });
        }

        const orderLinesData = items.map((item) => ({
            itemId: Number(item.itemId),
            quantity: Number(item.quantity),
            fulfilled: 0,
        }));

        if (orderLinesData.some((item) => !item.itemId || item.quantity <= 0)) {
            return res.status(400).json({ message: "Invalid order item payload" });
        }

        const result = await prisma.order.create({
            data: {
                userId,
                status: "PENDING",
                lines: {
                    create: orderLinesData,
                }
            },
            include: {
                lines: true,
            }
        });

        await createOrderAuditLog(userId, result.id, {
            status: result.status,
            lineCount: result.lines.length,
            allocationStrategy: "DEFERRED_TO_STAFF"
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
        const orders = await prisma.$transaction(async (tx) => {
            const currentOrders = await tx.order.findMany({
                where: { userId },
                include: {
                    lines: {
                        include: { item: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            for (const order of currentOrders) {
                await reconcileBacklogOrder(tx, order);
            }

            return tx.order.findMany({
                where: { userId },
                include: {
                    lines: {
                        include: { item: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }).then((orders) => Promise.all(orders.map((order) => attachAvailableStock(tx, order))));
        });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /orders/picking/pending - ดู orders ที่ต้อง pick (สำหรับ warehouse staff)
exports.getPendingPickingOrders = async (req, res) => {
    try {
        const orders = await prisma.$transaction(async (tx) => {
            const currentOrders = await tx.order.findMany({
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

            for (const order of currentOrders) {
                await reconcileBacklogOrder(tx, order);
            }

            return tx.order.findMany({
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
            }).then((orders) => Promise.all(orders.map((order) => attachAvailableStock(tx, order))));
        });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStaffDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [queueOrders, todayLogs] = await Promise.all([
            prisma.$transaction(async (tx) => {
                const currentOrders = await tx.order.findMany({
                    where: {
                        status: { in: ['PENDING', 'PROCESSING', 'BACKLOG'] }
                    },
                    include: { lines: true }
                });

                for (const order of currentOrders) {
                    await reconcileBacklogOrder(tx, order);
                }

                return tx.order.findMany({
                    where: {
                        status: { in: ['PENDING', 'PROCESSING', 'BACKLOG'] }
                    }
                });
            }),
            prisma.log.findMany({
                where: {
                    userId,
                    createdAt: { gte: todayStart }
                }
            })
        ]);

        const summary = {
            queue: {
                pending: queueOrders.filter((order) => order.status === 'PENDING').length,
                processing: queueOrders.filter((order) => order.status === 'PROCESSING').length,
                backlog: queueOrders.filter((order) => order.status === 'BACKLOG').length,
                total: queueOrders.length
            },
            todayActivity: {
                inboundUnits: todayLogs
                    .filter((log) => log.action === 'ADD')
                    .reduce((sum, log) => sum + log.quantity, 0),
                pickedUnits: todayLogs
                    .filter((log) => log.action === 'WITHDRAW')
                    .reduce((sum, log) => sum + log.quantity, 0),
                transferUnits: todayLogs
                    .filter((log) => log.action === 'TRANSFER_IN' || log.action === 'TRANSFER_OUT')
                    .reduce((sum, log) => sum + log.quantity, 0),
                movementCount: todayLogs.length
            }
        };

        res.json(summary);
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
        const orderId = Number(id);

        if (status === "PROCESSING") {
            const allocationStrategy = await getAllocationStrategy();
            const stockOrderBy = allocationStrategy === "LIFO" ? { id: "desc" } : { id: "asc" };

            const order = await prisma.$transaction(async (tx) => {
                const currentOrder = await tx.order.findUnique({
                    where: { id: orderId },
                    include: {
                        lines: true,
                        user: { select: { username: true } }
                    }
                });

                if (!currentOrder) {
                    throw new Error("Order not found");
                }

                if (currentOrder.status === "COMPLETED" || currentOrder.status === "CANCELLED") {
                    throw new Error("This order can no longer be processed");
                }

                let workingOrder = currentOrder;
                let attempts = 0;

                while (attempts < 3) {
                    await allocateOrderStock(tx, workingOrder, req.user.id, stockOrderBy);

                    const refreshedOrder = await tx.order.findUnique({
                        where: { id: orderId },
                        include: {
                            lines: { include: { item: true } },
                            user: { select: { username: true } }
                        }
                    });

                    const hasRemaining = refreshedOrder.lines.some((line) => line.fulfilled < line.quantity);
                    if (!hasRemaining) {
                        workingOrder = refreshedOrder;
                        break;
                    }

                    const stockStillEnough = await hasEnoughStockForRemaining(tx, refreshedOrder);
                    workingOrder = refreshedOrder;

                    if (!stockStillEnough) {
                        break;
                    }

                    attempts += 1;
                }

                const hasRemaining = workingOrder.lines.some((line) => line.fulfilled < line.quantity);
                const nextStatus = hasRemaining ? "BACKLOG" : "PROCESSING";

                const updatedOrder = await tx.order.update({
                    where: { id: orderId },
                    data: { status: nextStatus },
                    include: {
                        lines: { include: { item: true } },
                        user: { select: { username: true } }
                    }
                });

                const withStock = await attachAvailableStock(tx, updatedOrder);

                return {
                    ...withStock,
                    shortage: nextStatus === "BACKLOG" ? getRemainingShortage(workingOrder.lines) : []
                };
            });

            await createOrderAuditLog(req.user.id, orderId, {
                status: order.status,
                requestedStatus: status
            });

            return res.json(order);
        }

        const currentOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                lines: true
            }
        });

        if (!currentOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        const hasRemaining = currentOrder.lines.some((line) => line.fulfilled < line.quantity);
        if (hasRemaining) {
            return res.status(400).json({ message: "Order cannot be completed until all items are picked" });
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status: "COMPLETED" },
            include: {
                lines: { include: { item: true } },
                user: { select: { username: true } }
            }
        });

        await createOrderAuditLog(req.user.id, orderId, {
            status: order.status,
            requestedStatus: status
        });

        res.json(order);
    } catch (err) {
        const message = err.message === "Order not found" ? 404 : 400;
        res.status(message).json({ message: err.message });
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
