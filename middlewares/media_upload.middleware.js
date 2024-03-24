const { response, request } = require("express");
const cloudinary = require('cloudinary').v2;
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Retrieves file from req.files and stores it
 * @param {request} req
 * @param {response} res
 */
const processFileUpload = async function (req, res, next) {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({ message: "Please upload a file" });
      return;
    }

    if (req.files.form.mimetype !== "application/pdf") {
      res.status(400).json({ message: "Only PDF files are allowed" });
      return;
    }

    console.log(req.files.form.tempFilePath);

    const file = req.files.form;
    const result = await cloudinary.uploader.upload(file.tempFilePath);

    console.log(result)

    // update the req.body
    req.body = {
      ...req.body,
      name: req.files.form.name.toLowerCase(),
      pathToFile: result.secure_url,
    };

  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong while uploading file" });
    return;
  }
};

module.exports = {
  processFileUpload,
};
