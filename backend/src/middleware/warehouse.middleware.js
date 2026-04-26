module.exports = (req, res, next) => {
  if (!req.user || !["admin", "staff"].includes(req.user.role)) {
    return res.status(403).json({ message: "Warehouse staff or admin only" });
  }
  next();
};
