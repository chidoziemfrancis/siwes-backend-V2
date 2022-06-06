// import packages
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api.routes');

require('dotenv').config();

// initialize app
const app = express();

// set up middlewares
app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get((req, res) => {
  res.status(404).json({ 'message': 'Not Found' });
})

// connect to database and start app
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI;

async function main() {
  try {

    console.log("Connecting to database...");
    
    await mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to database...");

    console.log("Starting app...");
    app.listen(PORT, () => {
      console.log(`App is live on port: ${PORT}`);
    })

    // re reoute to api
    app.use('/api', apiRoutes);
  
  } catch (error) {
    console.log(`App failed to start due to ${error}`);
  }
}

main();