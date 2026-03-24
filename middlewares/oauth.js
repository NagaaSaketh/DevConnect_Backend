const verifyAccessToken = (req, res, next) => {
  if (!req.cookies.acess_token) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

module.exports = { verifyAccessToken };
