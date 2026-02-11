require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mediaRoutes = require("./routes/media-routes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const connectToDB = require("./database/db");
const { rateLimiter } = require("./middleware/rateLimiter");
const { sensitiveEndpointsLimiter } = require("./middleware/basicRateLimiter");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./eventHandlers/media-event-handlers");

const app = express();
const PORT = process.env.PORT || 3003;

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

app.use("/api/media/upload", sensitiveEndpointsLimiter(5, 10 * 1000 * 60)); // allows upto 5 uploads in 10 mins

app.use("/api/media", mediaRoutes);
//global error handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();

    //consume all events
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      console.log(`Media service running on port : ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    `Unhandled Rejection at: ${promise}, reason: ${reason?.message || reason}`
  );
});
