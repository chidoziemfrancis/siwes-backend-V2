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
    isAbroad: {
      type: Boolean,
      default: false,
    },
    country: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
      lowercase: true,
    },
    LGA: {
      type: String,
      required: false,
      lowercase: true,
    },
    street: {
      type: String,
      required: false,
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

// Add custom validation for conditional requirements
CompanySchema.pre("validate", function (next) {
  // If abroad, country is required
  if (this.isAbroad) {
    if (!this.country || this.country.trim() === "") {
      this.invalidate("country", "Country is required");
    }
  }
  
  // If not abroad (i.e., in Nigeria), state, LGA and street are required
  if (!this.isAbroad) {
    if (!this.state || this.state.trim() === "") {
      this.invalidate("state", "State is required");
    } else if (this.state.length < 3) {
      this.invalidate("state", "State must be at least 3 characters");
    }

    if (!this.LGA || this.LGA.trim() === "") {
      this.invalidate("LGA", "LGA is required");
    }

    if (!this.street || this.street.trim() === "") {
      this.invalidate("street", "Company Street is required");
    }
  }
  next();
});

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
