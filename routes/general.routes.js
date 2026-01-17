const router = require("express").Router();
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
  try {
    await redisClient.set("healthCheck", "OK", { EX: 10 });
    const value = await redisClient.get("healthCheck");
    if (value === "OK") {
      res.status(200).json({ message: "Redis is healthy" });
    } else {
      res.status(500).json({ message: "Redis test failed" });
    }
  } catch (error) {
    res.status(500).json({ message: "Redis connection error", error });
  }
});

module.exports = router;
