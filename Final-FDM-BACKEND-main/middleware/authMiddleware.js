const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/config");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: "Access denied, no token provided" });

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token has expired" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;