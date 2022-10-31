const { response, request } = require('express');

/**
 * Retrieves file from req.files and stores it
 * @param {request} req 
 * @param {response} res 
 */
const processFileUpload = async function(req, res, next) {
  try {

    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({ message: "Please upload a file" });
      return;
    }
  
    if (req.files.form.mimetype !== 'application/pdf') {
      res.status(400).json({ message: "Only PDF files are allowed" });
      return;
    }

    const uploadPath = './uploads/forms/' + req.files.form.name;

    // update the req.body
    req.body = {
      ...req.body,
      name: req.files.form.name,
      pathToFile: uploadPath
    }

    req.files.form.mv(uploadPath, function(err) {
      if (err) {
        res.status(500).json({ message: "Something went wrong while uploading file" })
        return;
      }

      next();
    })
  
  } catch (error) {
    res.status(500).json({ message: "Something went wrong while uploading file" });
    return;
  }
};

module.exports = {
  processFileUpload
}