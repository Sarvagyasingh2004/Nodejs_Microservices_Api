const Media = require("../models/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");
const { validateImage } = require("../utils/validation");

const uploadMedia = async (req, res) => {
  logger.info("Starting media upload");
  try {
    if (!req.file) {
      logger.error("No file found. Please add a file and try again! ");

      return res.status(400).json({
        success: false,
        message: "No file found. Please add a file and try again!",
      });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      logger.error(
        "Not an image file. Please add an image file and try again! "
      );
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    const { originalname, mimetype } = req.file;
    const userId = req.user.userId;
    logger.info(`File details: name=${originalname}, type:${mimetype}`);
    logger.info("Uploading to cloudinary starting...");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `Cloudinary upload successfully. Public Id: - ${cloudinaryUploadResult.public_id}`
    );
    const mediaPayload = {
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    };
    const { error } = validateImage(mediaPayload);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const newlyCreatedMedia = new Media(mediaPayload);
    await newlyCreatedMedia.save();
    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media uploaded successfully",
    });
  } catch (error) {
    logger.error("Error uploading media", error);
    res.status(500).json({
      success: false,
      message: "Error uploading media",
    });
  }
};

const getAllMedias = async (req, res) => {
  try {
    const results = await Media.find({});
    res.json(results);
  } catch (error) {
    logger.error("Error fetching medias", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medias",
    });
  }
};
module.exports = { uploadMedia, getAllMedias };
