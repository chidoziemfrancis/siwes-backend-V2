const mongoose = require('mongoose');
const { isMobilePhone, isEmail } = require('validator');
const bcrypt = require('bcrypt');

const SupervisorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    lowercase: true,
    minLength: [3, 'First name must be at least 3 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    lowercase: true,
    minLength: [3, 'Last name must be at least 3 characters'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    minLength: [11, 'Phone number must be at least 11 characters'],
    validate: [isMobilePhone, 'Phone number must be a valid phone number'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    minLength: [3, 'Email must be at least 3 characters'],
    unique: true,
    validate: [isEmail, 'Email must be a valid email']
  },
  office: {
    type: String,
    lowercase: true,
    minLength: [4, 'Office must be at least 4 characters'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters'],
  }
}, { timestamps: true })

// Hash password before saving
SupervisorSchema.pre('save', async function(next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  next();
});

const Supervisor = mongoose.model('Supervisor', SupervisorSchema);

module.exports = Supervisor;