const mongoose = require("mongoose");
const { isMobilePhone, isEmail } = require("validator");

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      lowercase: true,
      minLength: [3, "Name must be at least 3 characters"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      lowercase: true,
      minLength: [3, "Address must be at least 3 characters"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
      lowercase: true,
      minLength: [3, "State must be at least 3 characters"],
    },
    LGA: {
      type: String,
      required: false,
      lowercase: true,
    },
    street: {
      type: String,
      required: [true, "Company Street is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      minLength: [3, "Email must be at least 3 characters"],
      validate: [isEmail, "Email must be a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      lowercase: true,
      minLength: [7, "Phone number must be at least 7 characters"],
      validate: [isMobilePhone, "Phone number must be a valid phone number"],
    },
    studentCode: {
      type: String,
      required: [true, "Student code is required"],
      unique: true,
    },
    assignedDepartment: {
      type: String,
      required: [true, "Assigned department is required"],
      lowercase: true,
    },
    jobDescription: {
      type: String,
      required: [true, "Job description is required"],
    },
    resumptionDate: {
      type: Date,
      required: [true, "Resumption date is required"],
    },
    expectedEndDate: {
      type: Date,
      required: [true, "Expected end date is required"],
    },
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
