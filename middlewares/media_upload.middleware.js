const { response, request } = require("express");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const processFileUpload = async function (req, res, next) {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(400).json({ message: "Please upload a file" });
      return;
    }

    if (req.files.file.mimetype !== "application/pdf") {
      res.status(400).json({ message: "Only PDF files are allowed" });
      return;
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, "..", "uploads", "forms");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(req.files.file.name);
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const fileName = `${uniqueId}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to disk
    await fs.writeFile(filePath, req.files.file.data);

    // Generate public URL path
    const publicPath = `/uploads/forms/${fileName}`;
    const publicId = `forms/${uniqueId}`; // Keep publicId for backward compatibility

    // Update the req.body
    req.body = {
      ...req.body,
      name: req.files.file.name.toLowerCase(),
      pathToFile: publicPath,
      publicId: publicId,
    };
    next();
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      message: "Something went wrong while uploading file. Please try again.",
    });
    return;
  }
};

module.exports = {
  processFileUpload,
};
