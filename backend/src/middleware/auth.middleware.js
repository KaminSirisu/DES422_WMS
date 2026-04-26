const jwt = require("jsonwebtoken");
const prisma = require("../utils/prisma");

module.exports = async (req, res, next) => {

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, username: true }
    });

    if (!currentUser) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = currentUser;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
