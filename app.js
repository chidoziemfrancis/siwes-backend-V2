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

const app = express();

const corsOption = {
  credentials: true,
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://siwes-fe.onrender.com",
      "https://siwes-fe-sqhb.onrender.com",
      "https://siwes-dev.onrender.com",
      "https://www.babcock-siwes.com",
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

app.use(express.static(path.join(__dirname, "build")));

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

    (async () => {
      try {
        const key = "testKey";
        const value = "testValue";
        await redisClient.set(key, value, { EX: 10 });
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

    app.use("/api", apiRoutes);

    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "build", "index.html"));
    });
  } catch (error) {
    console.log(`App failed to start due to ${error}`);
  }
}

main();
