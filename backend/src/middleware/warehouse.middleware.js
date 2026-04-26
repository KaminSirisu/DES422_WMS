module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== "staff") {
    return res.status(403).json({ message: "Warehouse staff only" });
  }
  next();
};
