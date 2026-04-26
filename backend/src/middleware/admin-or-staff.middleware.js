module.exports = (req, res, next) => {
  if (!req.user || !["admin", "staff"].includes(req.user.role)) {
    return res.status(403).json({ message: "Admin or staff only" });
  }
  next();
};
