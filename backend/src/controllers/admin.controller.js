const prisma = require("../utils/prisma");

exports.updateUserRole = async (req, res) => {
  const { userId, role } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};