const router = require("express").Router();
const mongoose = require("mongoose");
const coordinatorsRoutes = require("./coordinators.routes");
const studentsRoutes = require("./students.routes");
const supervisorsRoutes = require("./supervisors.routes");
const directorsRoutes = require("./director.routes");
const supportRoutes = require("./support.routes");
const authRoutes = require("./auth.routes");
const redisClient = require("../utils/redisClient");
const {
  get_public_schools,
  get_public_departments,
} = require("../controllers/general.controller");

// render needs a route that will always return success
router.get("/render", (req, res) => {
  res.status(200).send();
});

// Coordinator specific routes
router.use("/coordinators", coordinatorsRoutes);

// Supervisor specific routes
router.use("/supervisor", supervisorsRoutes);

// Student specific routes
router.use("/student", studentsRoutes);

// Director specific routes
router.use("/directors", directorsRoutes);

// Support specific routes
router.use("/support", supportRoutes);

router.use("/auth", authRoutes);

router.get("/schools", get_public_schools);
router.get("/departments", get_public_departments);

router.get("/health", async (req, res) => {
  const healthStatus = {
    status: "UP",
    timestamp: new Date(),
    services: {
      database: "UNKNOWN",
      redis: "UNKNOWN",
    },
  };

  let hasError = false;

  // Check MongoDB connection status
  try {
    const dbState = mongoose.connection.readyState;
    const states = ["DISCONNECTED", "CONNECTED", "CONNECTING", "DISCONNECTING"];
    healthStatus.services.database = states[dbState] || "UNKNOWN";

    if (dbState !== 1) {
      hasError = true;
      console.error(`Health Check Warning: MongoDB is not connected. Current state: ${healthStatus.services.database}`);
    }
  } catch (dbError) {
    hasError = true;
    healthStatus.services.database = "ERROR";
    healthStatus.services.databaseError = dbError.message;
    console.error("Health Check Error: MongoDB check failed:", dbError);
  }

  // Check Redis connection status
  try {
    await redisClient.set("healthCheck", "OK", { EX: 10 });
    const redisValue = await redisClient.get("healthCheck");
    if (redisValue === "OK") {
      healthStatus.services.redis = "CONNECTED";
    } else {
      hasError = true;
      healthStatus.services.redis = "FAILED";
      console.error("Health Check Warning: Redis write/read check failed");
    }
  } catch (redisError) {
    hasError = true;
    healthStatus.services.redis = "ERROR";
    healthStatus.services.redisError = redisError.message;
    console.error("Health Check Error: Redis check failed:", redisError);
  }

  if (hasError) {
    healthStatus.status = "DOWN";
    return res.status(500).json(healthStatus);
  }

  return res.status(200).json(healthStatus);
});

module.exports = router;
