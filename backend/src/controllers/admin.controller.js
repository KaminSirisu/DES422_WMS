const prisma = require("../utils/prisma");

exports.updateUserRole = async (req, res) => {
  const { userId, role } = req.body;

  try {
    if (!userId || isNanNumber(userId)) {
      return res.status(400).json({ message: "Valid userId is required"});
    }

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data: { role },
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};