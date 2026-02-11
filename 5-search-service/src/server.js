require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const helmet = require("helmet");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const connectToDB = require("./database/db");
const { redisClient } = require("./config/redis");
const { rateLimiter } = require("./middleware/rateLimiter");
const searchRoutes = require("./routes/search-routes");
const {
  handlePostCreated,
  handlePostDelete,
} = require("./eventHandlers/search-event-handlers");

const app = express();
const PORT = process.env.PORT || 3004;

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
  "/api/search",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  searchRoutes
);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDelete);

    app.listen(PORT, () => {
      logger.info(`Search service is running on port: ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start search service", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    `Unhandled Rejection at: ${promise}, reason: ${reason?.message || reason}`
  );
});
