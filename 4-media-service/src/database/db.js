const mongoose = require("mongoose");

const logger = require("../utils/logger");
const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection error", error);
  }
};

module.exports = connectToDB;
