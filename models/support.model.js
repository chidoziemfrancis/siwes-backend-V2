const mongoose = require("mongoose");
const { isMobilePhone, isEmail } = require("validator");
const bcrypt = require("bcrypt");

const SupportSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      lowercase: true,
      minLength: [3, "First name must be at least 3 characters"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      lowercase: true,
      minLength: [3, "Last name must be at least 3 characters"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      minLength: [11, "Phone number must be at least 11 characters"],
      validate: [isMobilePhone, "Phone number must be a valid phone number"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      minLength: [3, "Email must be at least 3 characters"],
      unique: true,
      validate: [isEmail, "Email must be a valid email"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please specify a password"],
      minLength: [8, "password must be at least 8 characters long"],
      maxLength: [32, "Password must be less than 32 characters"],
      // match: [/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[]:;<,>,.?\/~_\+-=\|\\])$/, 'Password must contain numbers, symbols and letters (upper and lowercase)']
    },
    validation_secret: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving
SupportSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

const Support = mongoose.model("Support", SupportSchema);

module.exports = Support;
