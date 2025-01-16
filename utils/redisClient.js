const redis = require("redis");
require("dotenv").config();

// Create Redis client with credentials
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  password: process.env.REDIS_PASS
});

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error("Failed to connect to Redis:", err);
});

// Event listeners for Redis
redisClient.on("connect", () => {
  console.log("Connected to Redis Cloud");
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});

module.exports = redisClient;
