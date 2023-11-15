const mongoose = require("mongoose");
const { isMobilePhone, isEmail } = require("validator");
const bcrypt = require("bcrypt");

const bankDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    lowercase: true,
    required: [true, "Bank name is required"],
  },
  accountNumber: {
    type: String,
    maxLength: [10, "Account number cannot exceed 10 digits"],
    minLength: [10, "Account number must be 10 digits long"],
    required: [true, "Account number is required"],
  },
  sortCode: {
    type: String,
    required: [true, "Bank sort code is required"],
  },
});

const StudentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      lowercase: true,
      minLength: [3, "First name must be at least 3 characters"],
      trim: true,
    },
    middleName: {
      type: String,
      lowercase: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      lowercase: true,
      minLength: [3, "Last name must be at least 3 characters"],
      trim: true,
    },
    course: {
      type: String,
      required: [true, "Course is required"],
      lowercase: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      lowercase: true,
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
    matricNo: {
      type: String,
      required: [true, "Matric number is required"],
      lowercase: true,
      minLength: [7, "Matric number must be at least 7 characters"],
      unique: true,
      trim: true,
    },
    sex: {
      type: String,
      required: [true, "Gender is required"],
    },
    level: {
      type: String,
      required: [true, "Level is required"],
    },
    faculty: {
      type: String,
      required: [true, "Faculty is required"],
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      minLength: [11, "Phone number must be at least 11 characters"],
      validate: [isMobilePhone, "Phone number must be a valid phone number"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please specifiy a password"],
      minLength: [8, "password must be at least 8 characters long"],
      maxLength: [32, "Password must be less than 32 characters"],
      // match: [/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[]:;<,>,.?\/~_\+-=\|\\])$/, 'Password must contain numbers, symbols and letters (upper and lowercase)']
    },
    validation_secret: {
      type: String,
    },
    studentCode: {
      type: String,
      unique: true,
    },
    bankDetails: {
      type: bankDetailsSchema,
      required: [true, "Bank details is required"],
    },
  },
  { timestamps: true }
);

StudentSchema.pre("save", async function (next) {
  // Hash password before saving
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // genereate student code
  const year = new Date(Date.now()).getFullYear();

  const studentCode = `${this.department
    .split(" ")
    .join("-")}-${year}-${this.matricNo.slice(3, 7)}`;
  this.studentCode = studentCode;

  next();
});

const Student = mongoose.model("Student", StudentSchema);

module.exports = Student;
