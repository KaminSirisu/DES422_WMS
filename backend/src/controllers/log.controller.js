const prisma = require("../utils/prisma");

exports.getLogs = async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      include: {
        user: {
          select: { username: true },
        },
        item: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};