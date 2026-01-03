const express = require("express");
const DevUser = require("../models/devUser");
const { validateSignUpData } = require("../utils/validator");
const bcrypt = require("bcrypt");
const authRouter = express.Router();
const jwt = require("jsonwebtoken");

// API route to create a new user
authRouter.post("/signup", async (req, res) => {
  try {
    // Validating user data
    validateSignUpData(req);

    const { firstName, lastName, emailID, password } = req.body;

    // Encrypting the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new DevUser({
      firstName,
      lastName,
      emailID,
      password: hashedPassword,
    });
    const savedUser = await user.save();
    const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    // Add the token to cookie and send the response back to the user
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
    });
    res
      .status(201)
      .json({ message: "User added successfully", data: savedUser });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create new user",
      error: err.message,
    });
  }
});

// API route for user login

authRouter.post("/login", async (req, res) => {
  try {
    const { emailID, password } = req.body;
    const user = await DevUser.findOne({ emailID: emailID });
    if (!user) {
      throw new Error("Invalid credentials");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      // Create a JWT Token

      const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

      // Add the token to cookie and send the response back to the user
      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000),
      });
      res.status(200).json(user);
    } else {
      res.status(400).json("Invalid credentials");
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to login", error: err.message });
  }
});

// API route for user logout

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.status(200).send("Logout successful!");
});

module.exports = authRouter;
