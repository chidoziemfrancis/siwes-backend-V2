const crypto = require("crypto");
const fs = require("fs");
const { uploadPdfFromBuffer } = require("../utils/cloudinary");

const processFileUpload = async function (req, res, next) {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({ message: "Please upload a file" });
      return;
    }

    const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
    if (!file) {
      res.status(400).json({ message: "No file in request" });
      return;
    }

    if (file.mimetype !== "application/pdf") {
      res.status(400).json({ message: "Only PDF files are allowed" });
      return;
    }

    const fileBuffer = file.data ?? (file.tempFilePath ? fs.readFileSync(file.tempFilePath) : null);
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      console.error("File upload: invalid buffer", { hasData: !!file.data, hasTempPath: !!file.tempFilePath });
      res.status(400).json({ message: "Invalid file data received" });
      return;
    }

    const uniqueId = crypto.randomBytes(16).toString("hex");
    const fileExtension = file.name ? file.name.split(".").pop().toLowerCase() : "pdf";
    const publicId = `siwes/forms/${uniqueId}`;

    const uploadResult = await uploadPdfFromBuffer(fileBuffer, {
      folder: "siwes/forms",
      publicId,
    });

    req.body = {
      ...req.body,
      name: (file.name || `form.${fileExtension}`).toLowerCase(),
      pathToFile: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
    next();
  } catch (error) {
    console.error("File upload error:", error?.message || error);
    const isDev = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Something went wrong while uploading file. Please try again.",
      ...(isDev && error?.message && { detail: error.message }),
    });
    return;
  }
};

module.exports = {
  processFileUpload,
};
