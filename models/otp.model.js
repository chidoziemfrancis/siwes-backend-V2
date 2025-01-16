const mongoose = require("mongoose");
const { isEmail } = require("validator");

const OTPSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "OTP must be set"],
      match: [/^[a-f0-9]{6}$/, "OTP must be a 6-character hexadecimal string"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      minLength: [3, "Email must be at least 3 characters"],
      validate: [isEmail, "Email must be a valid email"],
      match: [/student.babcock.edu.ng$/, "Invalid email type"],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300,
    },
  },
  { timestamps: true }
);

// Create the model
const OTP = mongoose.model("otp", OTPSchema);

module.exports = OTP;
