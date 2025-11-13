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

/**
 * Deletes an asset from Cloudinary.
 * @param {string | null | undefined} publicId
 */
const deleteAsset = async (publicId) => {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete Cloudinary asset:", error.message);
  }
};

module.exports = {
  uploadImageFromBuffer,
  deleteAsset,
  ALLOWED_IMAGE_MIME_TYPES,
};


