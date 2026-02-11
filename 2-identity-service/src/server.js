require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const connectToDB = require("./database/db");
const routes = require("./routes/identity-service");
const logger = require("./utils/logger");
const { rateLimiter } = require("./middleware/rateLimiter");
const { sensitiveEndpointsLimiter } = require("./middleware/basicRateLimiter");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

connectToDB();

//middlewares
app.use(helmet()); //secures express app by setting various HTTP headers automatically.
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${JSON.stringify(req.body)}`);
  next();
});

//Middleware for DDoS protection and rate limiting - rate-limiter-flexible
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

//Ip beased rate limiting for sensititve endpoints - express-rate-limiter
app.use("/api/auth/register", sensitiveEndpointsLimiter(50, 10 * 1000 * 60));

app.use("/api/auth", routes);

//global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Identity service running on port : ${PORT}`);
});

// unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
