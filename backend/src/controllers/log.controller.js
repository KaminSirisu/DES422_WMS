const prisma = require("../utils/prisma");

exports.getLogs = async (req, res) => {
  try {
    const { action, startDate, endDate } = req.query;

    const logs = await prisma.log.findMany({
      where: {
        ...(action && { action }),
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        user: { select: { username: true } },
        item: { select: { name: true } },
        location: { select: { name: true } },
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