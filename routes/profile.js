const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validator");
const bcrypt = require("bcrypt");
const profileRouter = express.Router();

// API route to get the profile
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to user profile", error: err.message });
  }
});

// API route to edit your profile.
profileRouter.put("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      return res.status(400).json({ message: "Invalid edit request" });
    }
    const loggedInUser = req.user;
    // console.log(loggedInUser);

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

    await loggedInUser.save();

    res
      .status(200)
      .json({ message: "Profile updated successfully.", data:loggedInUser});
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to edit profile", error: err.message });
  }
});

profileRouter.put("/profile/password", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        message: "New password is required",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to change password", error: err.message });
  }
});

module.exports = profileRouter;
