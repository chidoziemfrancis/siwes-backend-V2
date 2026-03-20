// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
// This initializes Sentry before any other imports
require("./instrument.js");

// All other imports below
const Sentry = require("@sentry/node");

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
const helmet = require("helmet");
const { generalLimiter } = require("./middlewares/rateLimit.middleware");
const { blockBots } = require("./middlewares/botDetection.middleware");

// Only load Scalar in non-production environments (development/staging)
// Scalar is an ES module and causes issues in production environments like Vercel
let apiReference = null;
if (process.env.NODE_ENV !== "production") {
  try {
    apiReference = require("@scalar/express-api-reference").apiReference;
  } catch (error) {
    console.log("Scalar API Reference not available:", error.message);
  }
}

// Fix Mongoose deprecation warning
mongoose.set("strictQuery", false);

const app = express();

// Trust proxy for correct IP in rate limiting (Vercel, load balancers, etc.)
app.set("trust proxy", 1);

const corsOption = {
  credentials: true,
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3060",
      "http://localhost:3001",
      "https://siwes-website.vercel.app",
      "https://www.babcock-siwes.com",
      "https://bucc-siwes-website.vercel.app",
      "https://babcock-siwes.com",
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Only enable Scalar API Reference in non-production environments
if (apiReference) {
  app.use(
    "/reference",
    apiReference({
      spec: {
        content: swaggerSpec,
      },
    })
  );
}

app.use(cors(corsOption));
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled to allow API docs; enable for stricter security
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

// Serve static files from uploads directory for forms
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI;

async function main() {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    await mongoose.connect(DB_URI);
    console.log("MongoDB connected successfully");

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(err, {
          tags: { errorType: "MongoDBConnectionError" },
        });
      }
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

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

    // Anti-automation: rate limiting + bot detection (Puppeteer, Playwright, etc.)
    app.use("/api", blockBots, generalLimiter, apiRoutes);

    // Catch-all route for API requests
    app.get("*", (req, res) => {
      const endpoints = ["/api", "/api-docs"];
      if (apiReference) {
        endpoints.push("/reference");
      }
      res.status(404).json({
        success: false,
        message: "API endpoint not found. This is a backend-only API service.",
        availableEndpoints: endpoints,
      });
    });

    // The error handler must be registered before any other error middleware and after all controllers
    if (process.env.SENTRY_DSN) {
      Sentry.setupExpressErrorHandler(app);
    }
  } catch (error) {
    console.log(`App failed to start due to ${error}`);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: { errorType: "AppStartupError" },
      });
    }
  }
}

main();
