const mongoose = require('mongoose');

const Supervision_ListSchema = new mongoose.Schema({
  studentCode: {
    type: String,
    required: [true, 'Student code is required'],
    unique: true
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supervisor',
    required: [true, 'Supervisor ID is required'],
  }
}, { timestamps: true })

const Supervision_List = mongoose.model('Supervision_List', Supervision_ListSchema);

module.exports = Supervision_List;