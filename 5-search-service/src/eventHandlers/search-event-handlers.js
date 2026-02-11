const Search = require("../models/Search");
const logger = require("../utils/logger");
const { redisClient } = require("../config/redis");
async function handlePostCreated(event) {
  try {
    const { postId, userId, content, createdAt } = event;
    const newSearchPost = new Search({
      postId: postId,
      userId: userId,
      content: content,
      createdAt: createdAt,
    });
    await newSearchPost.save();
    const keys = await redisClient.keys("query:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Invalidated ${keys.length} search cache keys`);
    }
    logger.info(
      `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`
    );
  } catch (error) {
    logger.error("Error handling post creation event", error);
  }
}

async function handlePostDelete(event) {
  try {
    await Search.findOneAndDelete({ postId: event.postId });
    const keys = await redisClient.keys("query:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Invalidated ${keys.length} search cache keys`);
    }

    logger.info(`Search post deleted: ${event.postId}`);
  } catch (error) {
    logger.error("Error handling post deletion event", error);
  }
}

module.exports = { handlePostCreated, handlePostDelete };
