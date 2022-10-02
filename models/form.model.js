const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Form name is required'],
    lowercase: true,
    minLength: [3, 'Form name must be at least 3 characters'],
  },
  description: {
    type: String,
    required: [true, 'Form description is required'],
  },
  purpose: {
    type: String,
    required: [true, 'Form purpose is required'],
  },
  pathToFile: {
    type: String,
    required: [true, 'Form path is required'],
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator',
    required: [true, 'Form uploader is required'],
  }
}, { timestamps: true })

// update the file path
FormSchema.pre('save', function(next) {
  this.pathToFile = `uploads/forms/${this.name}`;
  next();
})

const Form = mongoose.model('Form', FormSchema);

module.exports = Form;