const Search = require("../models/Search");
const logger = require("../utils/logger");


const searchPostController = async (req, res) => {
  logger.info("Search endpoint hit...");
  try {
    const { query } = req.query;
    const cacheKey = `query:${query}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }
    const results = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(results));
    return res.json(results);
  } catch (error) {
    logger.error("Error while searching post", error);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};

module.exports = { searchPostController };
