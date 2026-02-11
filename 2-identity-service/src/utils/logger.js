const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    //defines how to format the messages
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }), //adding stacktrace to logs
    winston.format.splat(), //supports for message templating
    winston.format.json() // formatting all log messages in json for structural logging
  ),
  defaultMeta: { service: "identity-service" },
  transports: [
    //specify output destination for logs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combine.log" }),
  ],
});

module.exports = logger;
