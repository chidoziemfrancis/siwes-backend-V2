const { response, request } = require("express");
const cloudinary = require('cloudinary').v2;
const { Readable } = require("stream");

async function uploadStream(buffer) {
  return new Promise((res, rej) => {
    const options = {
        use_filename: true,
        resource_type: "auto",
        folder: 'forms'
    }
    const theTransformStream = cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err) return rej(err);
        res(result);
      }
    );
    let str = Readable.from(buffer);
    str.pipe(theTransformStream);
  });
}

const processFileUpload = async function (req, res, next) {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({ message: "Please upload a file" });
      return;
    }

    if (req.files.form.mimetype !== "application/pdf") {
      res.status(400).json({ message: "Only PDF files are allowed" });
      return;
    }

    const buffer = req.files.form.data;
    const result = await uploadStream(buffer);

    // update the req.body
    req.body = {
      ...req.body,
      name: req.files.form.name.toLowerCase(),
      pathToFile: result.secure_url,
    };
    next();
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
