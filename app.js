// import packages
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

// initialize app
const app = express();

// set up middlewares
const corsOption = {
  credentials: true,
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://siwes-fe.onrender.com",
    "https://siwes-fe-sqhb.onrender.com",
  ], // Add your production frontend domain here
};

// Serve Swagger UI
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

app.use(express.static(path.join(__dirname, "build")));

// connect to database and start app
const PORT = process.env.PORT || 3000;
// const DB_URI = process.env.NODE_ENV === 'production' ? process.env.DB_URI : (process.env.NODE_ENV === "staging" ? process.env.DEV_DB_URI : process.env.LOCAL_DB_URI);
const DB_URI = process.env.DB_URI;

async function main() {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("Connecting to database...");

    await mongoose.connect(DB_URI);
    console.log("Connected to database");

    console.log("Starting app...");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`App is live on port: ${PORT}`);
    });

    //redis configuration test
    (async () => {
      try {
        // Test if Redis set and get work correctly
        const key = "testKey";
        const value = "testValue";
        
        await redisClient.set(key, value, { EX: 10 }); // Set with 10 seconds expiry
        const storedValue = await redisClient.get(key); 
        if (storedValue === value) {
          console.log("Redis connection is working!");
        } else {
          console.error("Redis test failed: value mismatch");
        }
      } catch (error) {
        console.error("Redis test failed:", error);
      }
    })();

    // re route to api
    app.use("/api", apiRoutes);

    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "build", "index.html"));
    });
  } catch (error) {
    console.log(`App failed to start due to ${error}`);
  }
}

main();
