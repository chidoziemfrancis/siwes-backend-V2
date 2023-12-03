const mongoose = require("mongoose");

const DeadlineSchema = new mongoose.Schema(
  {
    time: {
      type: Date,
      required: [true, "You must specify a date for the deadline"],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coordinator",
      required: [
        true,
        "You must specify a coordinator who updated the deadline",
      ],
    },
  },
  { timestamps: true }
);

const Deadline = mongoose.model("deadline", DeadlineSchema);

module.exports = Deadline;
