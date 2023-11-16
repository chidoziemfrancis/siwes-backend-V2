const mongoose = require("mongoose");
const { isEmail } = require("validator");

const OTPSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      min: [6, "OTP must be at least 6 characters long"],
      max: [6, "OTP must be at most 6 characters long"],
      required: [true, "OTP must be set"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      minLength: [3, "Email must be at least 3 characters"],
      unique: true,
      validate: [isEmail, "Email must be a valid email"],
      match: [/student.babcock.edu.ng$/, "Invalid email type"],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: new Date(),
      expires: '5m'
    }
  },
  { timestamps: true }
);

const OTP = mongoose.model("otp", OTPSchema);

module.exports = OTP;
