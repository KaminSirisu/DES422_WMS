const prisma = require("../utils/prisma");

exports.withdrawItem = async (req, res) => {
  const { itemId, locationId, quantity } = req.body;
  const userId = req.user.id;

  try {
    if (!itemId || !locationId || quantity <= 0 ) {
      return res.status(400).json({ message: "Item ID, Location ID and positive Quantity are required" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find stock at specific location
      const stock = await tx.itemLocation.findUnique({
        where: {
          itemId_locationId: {
            itemId: Number(itemId),
            locationId: Number(locationId),
          },
        },
      });

      // 2. Check if exists
      if (!stock) {
        throw new Error("Item not found in this location");
      }

      // 3. Check enough quantity
      if (stock.quantity < quantity) {
        throw new Error("Not enough stock in this location");
      }

      // 4. Update stock
      const updatedStock = await tx.itemLocation.update({
        where: {
          itemId_locationId: {
            itemId,
            locationId,
          },
        },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      // 5. Create log
      await tx.log.create({
        data: {
          userId,
          itemId,
          locationId,
          quantity,
          action: "WITHDRAW",
        },
      });

      return updatedStock;
    });

    res.json({
      message: "Withdraw successful",
      stock: result,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};