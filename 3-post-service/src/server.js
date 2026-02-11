require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/post-routes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const connectToDB = require("./database/db");
const { rateLimiter } = require("./middleware/rateLimiter");
const { redisClient } = require("./config/redis");
const { connectToRabbitMQ } = require("./utils/rabbitmq");

const app = express();
const PORT = process.env.PORT || 3002;

connectToDB();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${JSON.stringify(req.body)}`);
  next();
});

//DDoS protection and rate limiting - rate-limiter-flexible
app.use((req, res, next) => {
  try {
    rateLimiter.consume(req.ip).then(() => next());
  } catch (error) {
    logger.warn(`Rate limit exceeded for IP:${req.ip}`, error);
    res.status(429).json({
      success: false,
      message: "Too many requests",
    });
  }
});

app.use(
  "/api/posts",
  //middleware -> passes redis client which will be used by post controller
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRoutes
);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    app.listen(PORT, () => {
      console.log(`Post service running on port : ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
