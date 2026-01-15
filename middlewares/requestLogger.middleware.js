const morgan = require("morgan");
const logger = require("../utils/logger");

// Custom token for user ID
morgan.token("userId", (req) => {
  return req.user?._id || req.user?.id || "anonymous";
});

morgan.token("userType", (req) => {
  return req.user?.userType || "unknown";
});

// Custom format for production (JSON)
const productionFormat = JSON.stringify({
  method: ":method",
  url: ":url",
  status: ":status",
  responseTime: ":response-time ms",
  ip: ":remote-addr",
  userAgent: ":user-agent",
  userId: ":userId",
  userType: ":userType",
  timestamp: ":date[iso]",
});

// Development format (readable)
const developmentFormat =
  ":method :url :status :response-time ms - :userId (:userType)";

// Create morgan middleware
const requestLogger = morgan(
  process.env.NODE_ENV === "production" ? productionFormat : developmentFormat,
  {
    stream: {
      write: (message) => {
        // Parse JSON in production, or use message as-is in development
        if (process.env.NODE_ENV === "production") {
          try {
            const logData = JSON.parse(message.trim());
            logger.http("HTTP Request", logData);
          } catch (error) {
            logger.http("HTTP Request", { message: message.trim() });
          }
        } else {
          logger.http(message.trim());
        }
      },
    },
    // Skip logging for health checks or static assets
    skip: (req, res) => {
      return (
        req.url === "/health" ||
        req.url.startsWith("/uploads/") ||
        req.url.startsWith("/api-docs")
      );
    },
  }
);

module.exports = requestLogger;
