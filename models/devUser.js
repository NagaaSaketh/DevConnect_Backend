const mongoose = require("mongoose");
const validator = require('validator')
const devUserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    emailID: {
      type: String,
      required: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address");
        }
      },
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      min:18
    },
    gender: {
      type: String,
      enum:["Male","Female","Others"]
    },
    photoUrl: {
      type: String,
      default:
        "https://ongcvidesh.com/wp-content/uploads/2019/08/dummy-image.jpg",
    },
    about: {
      type: String,
      default: "Hi, Iam ready to collab!",
    },
    skills: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

const DevUser = mongoose.model("DevUser", devUserSchema);

module.exports = DevUser;
