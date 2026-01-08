const express = require("express");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { verifyAccessToken } = require("../middlewares/oauth");
const bcrypt = require("bcrypt");
const DevUser = require("../models/devUser");

const oauthRouter = express.Router();

oauthRouter.use(cookieParser());

oauthRouter.get("/user/profile/github", verifyAccessToken, async (req, res) => {
  try {
    const { access_token } = req.cookies;
    const githubUserDataResponse = await axios.get(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    res.json({ user: githubUserDataResponse.data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch github profile" });
  }
});

oauthRouter.get("/auth/github", (req, res) => {
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&scope=read:user user:email`;
  res.redirect(githubAuthUrl);
});

oauthRouter.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send({ message: "Authorization code not provided" });
  }

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user data from GitHub
    const githubUserResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Fetch user email
    const githubEmailResponse = await axios.get(
      "https://api.github.com/user/emails",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const githubData = githubUserResponse.data;
    const primaryEmail =
      githubEmailResponse.data.find((email) => email.primary)?.email ||
      githubData.email;

    // Check if user exists in database
    let user = await DevUser.findOne({ emailID: primaryEmail });

    if (user) {
      // Existing user - log them in
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${process.env.FRONTEND_URL}/`);
    } else {
      // New user - create account

      const randomPassword = Math.random().toString(36).slice(-8);

      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const newUser = new DevUser({
        firstName: githubData.name?.split(" ")[0] || githubData.login,
        lastName: githubData.name?.split(" ").slice(1).join(" ") || "",
        emailID: primaryEmail,
        photoUrl: githubData.avatar_url,
        about: githubData.bio || "",
        skills: [],
        githubProfile: githubData.html_url,
        password: hashedPassword,
      });

      await newUser.save();

      const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Redirect new users to edit profile
      return res.redirect(`${process.env.FRONTEND_URL}/profile`);
    }
  } catch (err) {
    console.error("GitHub OAuth error:", err);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

oauthRouter.get("/user/profile/google", verifyAccessToken, async (req, res) => {
  try {
    const { access_token } = req.cookies;
    const googleUserDataResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    res.json({ user: googleUserDataResponse.data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch google profile" });
  }
});

oauthRouter.get("/auth/google", (req, res) => {
  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=openid email profile` +
    `&access_type=offline` +
    `&prompt=consent`;
  res.redirect(googleAuthUrl);
});

oauthRouter.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send({ message: "Authorization code not provided" });
  }

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user data from Google
    const googleUserResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const googleData = googleUserResponse.data;
    const primaryEmail = googleData.email;

    // Check if user exists in database
    let user = await DevUser.findOne({ emailID: primaryEmail });

    if (user) {
      // Existing user - log them in
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${process.env.FRONTEND_URL}/`);
    } else {
      // New user - create account
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const newUser = new DevUser({
        firstName:
          googleData.given_name || googleData.name?.split(" ")[0] || "",
        lastName:
          googleData.family_name ||
          googleData.name?.split(" ").slice(1).join(" ") ||
          "",
        emailID: primaryEmail,
        photoUrl: googleData.picture || "",
        about: "",
        skills: [],
        githubProfile: "",
        password: hashedPassword,
      });

      await newUser.save();

      const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Redirect new users to edit profile
      return res.redirect(`${process.env.FRONTEND_URL}/profile`);
    }
  } catch (err) {
    console.error("Google OAuth error:", err);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

module.exports = oauthRouter;
