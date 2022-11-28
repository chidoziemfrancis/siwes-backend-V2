// import packages
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const compression = require("compression");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const apiRoutes = require("./routes/general.routes");

require("dotenv").config();

// initialize app
const app = express();

// set up middlewares
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  })
);
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

// connect to database and start app
const PORT = process.env.PORT || 3001;
const DB_URI = process.env.DB_URI;

async function main() {
  try {
    console.log("Connecting to database...");

    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database");

    console.log("Starting app...");
    app.listen(PORT, () => {
      console.log(`App is live on port: ${PORT}`);
    });

    // re reoute to api
    app.use("/api", apiRoutes);

    app.all("*", (req, res) => {
      res.status(404).json({ message: "Route not found" });
    });
  } catch (error) {
    console.log(`App failed to start due to ${error}`);
  }
}

main();
