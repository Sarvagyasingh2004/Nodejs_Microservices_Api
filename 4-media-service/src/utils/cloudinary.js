const cloudinary = require("../config/cloudinary");
const logger = require("../utils/logger");
const uploadMediaToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          logger.error("Error while uploading to cloudinary", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(file.buffer);
  });
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    // Log result clearly
    logger.info(`Cloudinary delete result for ${publicId}: ${result.result}`);

    // Optional: check if Cloudinary actually deleted it
    if (result.result !== "ok" && result.result !== "not found") {
      logger.warn(
        `Cloudinary returned unexpected result for ${publicId}: ${result.result}`
      );
    }

    return result;
  } catch (error) {
    logger.error(
      `Error deleting media from Cloudinary (publicId: ${publicId}) - ${error.message}`,
      {
        stack: error.stack,
      }
    );
    throw error; // ensure the handler above knows deletion failed
  }
};

module.exports = { uploadMediaToCloudinary, deleteMediaFromCloudinary };
