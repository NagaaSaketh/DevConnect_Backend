const jwt = require("jsonwebtoken");
const DevUser = require("../models/devUser");

const userAuth = async (req, res, next) => {
  try {
    // Read the token from the req cookies
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: "Please login!" });
    }
    const decodedObject = await jwt.verify(token, "DevTinder@$123");
    // Validating Token
    const { _id } = decodedObject;
    const user = await DevUser.findById(_id);
    if (!user) {
      throw new Error("User not found");
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(400).json({ message: "Error", error: err.message });
  }
};

module.exports = { userAuth };
