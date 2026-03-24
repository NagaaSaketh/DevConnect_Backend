const { initialiseDB } = require("./db/db.connect");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const http = require("http");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const allowedOrigins = [
  "http://localhost:5173",
  "https://dev-connect-collab.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const oauthRouter = require("./routes/oauth");
const initialiseSocket = require("./utils/socket");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", oauthRouter);

const server = http.createServer(app);
initialiseSocket(server);
initialiseDB();

app.get("/", (req, res) => {
  res.send("DEV TINDER BE");
});

const PORT = 4000;

server.listen(PORT, () => console.log("Server is running on", PORT));
