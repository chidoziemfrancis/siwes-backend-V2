const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({ 
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    require: [true, "Student id is required to create a grade"],
    unique: true
  },
  inspectionScore: {
    type: Number,
    default: 0,
  },
  weeklyReportsScore: {
    type: Number,
    default: 0,
  },
  defenseScore: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: null,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    require: [true, "Please re-authenticate and try again"]
  }
}, { timestamps: true });

const Grade = mongoose.model('grade', GradeSchema);

module.exports = Grade;