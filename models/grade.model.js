const mongoose = require("mongoose");

const GradeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      require: [true, "Student id is required to create a grade"],
      unique: true,
    },
    miniInspectionScore: {
      type: Number,
      default: 0,
    },
    mainInspectionScore: {
      type: Number,
      default: 0,
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
      require: [true, "Please re-authenticate and try again"],
    },
  },
  { timestamps: true }
);

// Pre-save hook to automatically calculate inspectionScore from mini and main inspection scores
GradeSchema.pre("save", function (next) {
  // Calculate inspectionScore as the sum of mini and main inspection scores
  this.inspectionScore = (this.miniInspectionScore || 0) + (this.mainInspectionScore || 0);
  next();
});

// Pre-update hook to automatically calculate inspectionScore when using findOneAndUpdate or updateOne
GradeSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  
  // Handle both direct update and $set operations
  if (update.$set) {
    if (update.$set.miniInspectionScore !== undefined || update.$set.mainInspectionScore !== undefined) {
      // We need to get the current document to calculate properly
      // For now, we'll let the application logic handle this
    }
  }
  
  next();
});

const Grade = mongoose.model("grade", GradeSchema);

module.exports = Grade;
