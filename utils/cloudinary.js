const cloudinary = require("cloudinary").v2;

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * Uploads an image buffer to Cloudinary using a data URI.
 * @param {Buffer} fileBuffer
 * @param {string} mimetype
 * @param {object} options
 * @returns {Promise<import("cloudinary").UploadApiResponse>}
 */
const uploadImageFromBuffer = async (
  fileBuffer,
  mimetype,
  options = {}
) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error("Invalid file buffer provided for upload");
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimetype)) {
    throw new Error("Unsupported image format");
  }

  const base64 = fileBuffer.toString("base64");
  const dataUri = `data:${mimetype};base64,${base64}`;

  const uploadOptions = {
    folder: options.folder || "siwes/students/profile",
    resource_type: "image",
    transformation:
      options.transformation || [
        { width: 1200, height: 1200, crop: "limit", quality: "auto" },
      ],
    eager:
      options.eager || [
        {
          width: 320,
          height: 320,
          crop: "fill",
          gravity: "face",
          quality: "auto",
        },
      ],
    overwrite: false,
    ...options.extra,
  };

  return cloudinary.uploader.upload(dataUri, uploadOptions);
};

const PDF_MIME_TYPE = "application/pdf";
const { Readable } = require("stream");

/**
 * Uploads a PDF buffer to Cloudinary using upload_stream (more reliable for binary data).
 * @param {Buffer} fileBuffer
 * @param {object} options - { folder, publicId }
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
const uploadPdfFromBuffer = async (fileBuffer, options = {}) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error("Invalid file buffer provided for PDF upload");
  }

  const uploadOptions = {
    folder: options.folder || "siwes/forms",
    resource_type: "raw",
    overwrite: false,
    ...options.extra,
  };

  if (options.publicId) {
    uploadOptions.public_id = options.publicId;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    const bufferStream = Readable.from(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Deletes an asset from Cloudinary.
 * @param {string | null | undefined} publicId
 * @param {object} options - { resource_type: "raw" } for non-image assets
 */
const deleteAsset = async (publicId, options = {}) => {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resource_type || "image",
    });
  } catch (error) {
    console.error("Failed to delete Cloudinary asset:", error.message);
  }
};

module.exports = {
  uploadImageFromBuffer,
  uploadPdfFromBuffer,
  deleteAsset,
  ALLOWED_IMAGE_MIME_TYPES,
  PDF_MIME_TYPE,
};


