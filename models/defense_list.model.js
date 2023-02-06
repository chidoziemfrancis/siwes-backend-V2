const mongoose = require("mongoose");

const Defense_ListSchema = new mongoose.Schema(
  {
    studentCode: {
      type: String,
      required: [true, "Student code is required"],
      unique: true,
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
      required: [true, "Supervisor ID is required"],
    },
    assignedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Defense_List = mongoose.model("Defense_List", Defense_ListSchema);

module.exports = Defense_List;
