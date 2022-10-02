const mongoose = require('mongoose');

const Weekly_ReportSchema = new mongoose.Schema({
  studentCode: {
    type: String,
    required: [true, 'Student code is required'],
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company ID is required'],
  },
  weekId: {
    type: Number,
    required: true
  },
  weekStart: {
    type: Date,
    required: true
  },
  monday: {
    type: String,
    default: ''
  },
  tuesday: {
    type: String,
    default: ''
  },
  wednesday: {
    type: String,
    default: ''
  },
  thursday: {
    type: String,
    default: ''
  },
  friday: {
    type: String,
    default: ''
  }
}, { timestamps: true })

const Weekly_Report = mongoose.model('Weekly_Report', Weekly_ReportSchema);

module.exports = Weekly_Report;