const mongoose = require('mongoose');
const { isMobilePhone, isEmail } = require('validator');
const bcrypt = require('bcrypt');

const StudentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    lowercase: true,
    minLength: [3, 'First name must be at least 3 characters'],
  },
  middleName: {
    type: String,
    lowercase: true,
    minLength: [3, 'Middle name must be at least 3 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    lowercase: true,
    minLength: [3, 'Last name must be at least 3 characters'],
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    lowercase: true,
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    minLength: [3, 'Email must be at least 3 characters'],
    unique: true,
    validate: [isEmail, 'Email must be a valid email']
  },
  matricNo: {
    type: String,
    required: [true, 'Matric number is required'],
    lowercase: true,
    minLength: [7, 'Matric number must be at least 7 characters'],
    unique: true,
  },
  sex: {
    type: String,
    required: [true, 'Gender is required']
  },
  level: {
    type: String,
    required: [true, 'Level is required'],
  },
  faculty: {
    type: String,
    required: [true, 'Faculty is required'],
    lowercase: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    minLength: [11, 'Phone number must be at least 11 characters'],
    validate: [isMobilePhone, 'Phone number must be a valid phone number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters']
  },
  studentCode: {
    type: String,
    required: [true, 'Student code is required'],
    unique: true
  }
}, { timestamps: true })

// Hash password before saving
StudentSchema.pre('save', async function(next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  next();
});

// Generate student code before saving
StudentSchema.pre('save', async function(next) {
  const year = new Date(Date.now).getFullYear();

  const studentCode =  `${this.department}-${year}-${this.matricNo.slice(3, 7)}`;
  this.studentCode = studentCode;
  
  next();
})

const Student = mongoose.model('Student', StudentSchema);

module.exports = Student;