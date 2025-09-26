const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const compression = require("compression");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const apiRoutes = require("./routes/general.routes");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerConfig");
const redisClient = require("./utils/redisClient");

require("dotenv").config();

// Fix Mongoose deprecation warning
mongoose.set("strictQuery", false);

const app = express();

const corsOption = {
  credentials: true,
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3060",
      "http://localhost:3001",
      "https://siwes-fe.onrender.com",
      "https://siwes-fe-sqhb.onrender.com",
      "https://siwes-dev.onrender.com",
      "https://www.babcock-siwes.com",
      "https://bucc-siwes-website.vercel.app",
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors(corsOption));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  fileUpload({
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    safeFileNames: true,
    preserveExtension: true,
    abortOnLimit: true,
    responseOnLimit: "Max file size is 5mb",
  })
);

// Static file serving removed - this is a backend-only API

const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI;

async function main() {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    mongoose.connect(DB_URI);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`App is live on port: ${PORT}`);
    });

    // Test Redis connection with timeout
    (async () => {
      try {
        // Wait a bit for Redis to connect
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const key = "testKey";
        const value = "testValue";

        // Set a timeout for the Redis test
        const testPromise = Promise.race([
          (async () => {
            await redisClient.set(key, value, { EX: 10 });
            const storedValue = await redisClient.get(key);
            return storedValue === value;
          })(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Redis test timeout")), 5000)
          ),
        ]);

        const testResult = await testPromise;
        if (testResult) {
          console.log("Redis connection is working!");
        } else {
          console.error("Redis test failed: value mismatch");
        }
      } catch (error) {
        console.error("Redis test failed:", error.message);
        console.log("App will continue without Redis functionality");
      }
    })();

    app.use("/api", apiRoutes);

    // Catch-all route for API requests
    app.get("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "API endpoint not found. This is a backend-only API service.",
        availableEndpoints: ["/api"],
      });
    });
  } catch (error) {
    console.log(`App failed to start due to ${error}`);
  }
  // Dara
}

main();
