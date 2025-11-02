const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School ID is required"],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ensure unique department names within the same school
DepartmentSchema.index({ name: 1, schoolId: 1 }, { unique: true });

const Department = mongoose.model("Department", DepartmentSchema);

module.exports = Department;

