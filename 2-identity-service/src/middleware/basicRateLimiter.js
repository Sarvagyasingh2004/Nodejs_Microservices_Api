const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("./rateLimiter");
const sensitiveEndpointsLimiter = (maxRequests, time) => {
  return rateLimit({
    max: maxRequests, //no. of requests in given time
    windowMs: time, //time period for requests
    standardHeaders: true, //allows clients to see how many requests are left in current time window
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Senesitive endpoint rate limit exceeded for IP:${req.ip}`);
      res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
  });
};

module.exports = { sensitiveEndpointsLimiter };
