/**
 * Rate limiting middleware to protect against brute force, scraping, and automation tools (Puppeteer, etc.)
 * Uses Redis for distributed rate limiting when available; falls back to in-memory when Redis is unavailable.
 */
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

let RedisStore;
try {
  RedisStore = require("rate-limit-redis").RedisStore;
} catch {
  RedisStore = null;
}

const redisClient = require("../utils/redisClient");

function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // requests per window
    message = "Too many requests from this IP, please try again later.",
    useRedis = true,
  } = options;

  const baseConfig = {
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    // Use ipKeyGenerator for IPv6-safe rate limiting (prevents bypass via IPv6 rotation)
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    // Skip rate limiting for health checks and docs
    skip: (req) => {
      const path = req.path || req.url || "";
      return (
        path === "/api/health" ||
        path === "/api/render" ||
        path.startsWith("/api-docs") ||
        path.startsWith("/reference")
      );
    },
  };

  // Use Redis store when available (falls back to memory if Redis is down)
  if (useRedis && RedisStore && redisClient) {
    try {
      return rateLimit({
        ...baseConfig,
        store: new RedisStore({
          sendCommand: (...args) => redisClient.sendCommand(args),
          prefix: "rl:",
        }),
      });
    } catch (err) {
      console.warn("Rate limiter: Redis store failed, using memory store:", err.message);
    }
  }

  return rateLimit(baseConfig);
}

// General API rate limiter
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 150,
});

module.exports = {
  generalLimiter,
  createRateLimiter,
};
