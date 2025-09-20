const redis = require("redis");
require("dotenv").config();

// Create Redis client with credentials and improved timeout settings
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    connectTimeout: 10000, // 10 seconds
    commandTimeout: 5000, // 5 seconds
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.error("Redis: Max reconnection attempts reached");
        return false;
      }
      return Math.min(retries * 100, 3000);
    },
  },
  password: process.env.REDIS_PASS,
});

// Connect to Redis with better error handling
redisClient.connect().catch((err) => {
  console.error("Failed to connect to Redis:", err.message);
});

// Event listeners for Redis
redisClient.on("connect", () => {
  console.log("Connected to Redis Cloud");
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redisClient.on("reconnecting", () => {
  console.log("Redis: Attempting to reconnect...");
});

redisClient.on("end", () => {
  console.log("Redis: Connection ended");
});

module.exports = redisClient;
