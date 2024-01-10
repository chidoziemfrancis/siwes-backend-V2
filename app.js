// import packages
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const compression = require("compression");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const apiRoutes = require("./routes/general.routes");
const path = require('path');

require("dotenv").config();

// initialize app
const app = express();

// set up middlewares
const corsOption = process.env.NODE_ENV == "production" ? {} : { credentials: true, origin: ['http://localhost:3000', 'http://localhost:3001'] };
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

app.use(express.static(path.join(__dirname, 'build')));

// connect to database and start app
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.NODE_ENV === 'production' ? process.env.DB_URI : (process.env.NODE_ENV === "staging" ? process.env.DEV_DB_URI : process.env.LOCAL_DB_URI);

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

    // re route to api
    app.use("/api", apiRoutes);

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'build', 'index.html'));
    });
  } catch (error) {
    console.log(`App failed to start due to ${error}`);
  }
}

main();
