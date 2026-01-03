const validator = require("validator");

const validateSignUpData = (req) => {
  const { firstName, lastName, emailID } = req.body;
  if (!firstName || !lastName) {
    throw new Error("Name is not valid");
  } else if (!validator.isEmail(emailID)) {
    throw new Error("Please enter valid email address");
  }
};

const validateEditProfileData = (req)=>{
  const allowedEditFields = ["firstName","lastName","emailID","photoUrl","gender","age","about","skills"]

  const isEditAllowed = Object.keys(req.body).every((field)=>allowedEditFields.includes(field))

  return isEditAllowed ;
}



module.exports = { validateSignUpData,validateEditProfileData };
