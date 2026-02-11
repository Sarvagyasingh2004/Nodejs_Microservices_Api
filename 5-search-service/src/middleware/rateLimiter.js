const { RateLimiterRedis } = require("rate-limiter-flexible");
const { redisClient } = require("../config/redis");
//DDoS protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

module.exports = { rateLimiter };
