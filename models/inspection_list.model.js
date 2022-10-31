const mongoose = require('mongoose');

const Inspection_listSchema = new mongoose.Schema({
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

const Inspection_list = mongoose.model('Inspection_list', Inspection_listSchema);

module.exports = Inspection_list;