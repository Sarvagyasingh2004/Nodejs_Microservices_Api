const Redis = require("ioredis");
const { RateLimiterRedis } = require("rate-limiter-flexible");

const redisClient = new Redis(process.env.REDIS_URL);
//DDoS protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10, //no. of requests in given time
  duration: 1, //time period for requests
});

module.exports = { rateLimiter, redisClient };
