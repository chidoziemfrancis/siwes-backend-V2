const { response } = require("express");
const { sendErrorMail } = require("../controllers/mail.controller");

/**
 * Transforms and send back a readable error message to the frontend client
 * @param {Error} error
 * @param {response} res
 */
const handleError = async function (error, res) {
  // process error from mongodb schema validation
  if (error.name === "ValidationError") {
    // get all validation errors
    const validationErrors = Object.values(error.errors).map(
      (err) => err.message
    );

    // send error to client
    res.status(400).json({
      message: "Bad Request",
      errors: validationErrors,
    });
    return;
  }

  // process error from mongodb duplicate key
  if (error.code === 11000) {
    let duplicateField = Object.keys(error.keyPattern)[0];
    res.status(400).json({ message: `${duplicateField} already exists` });
    return;
  }

  // this particular error won't happen in production as mongoDB will be deployed using a replica set
  if (
    error.toString() ===
    "MongoServerError: Transaction numbers are only allowed on a replica set member or mongos"
  ) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      "Attention Please!!! the last request failed because you are running this application with a standalone mongoDB deployment, please switch to a replica set"
    );

    await sendErrorMail({ error: error.toString() });
    res.status(500).json({ error: "An erorr occured on the server, the relavant team has been contacted, try again later" });
    return;
  }

  if (
    error.toString() ===
    "MongoServerError: $search stage is only allowed on MongoDB Atlas"
  ) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      "Attention Please!!! the last request failed because you need to switch to a MongoDB Atlas deployment to use the $search stage"
    );

    await sendErrorMail({ error: error.toString() });
    res.status(500).json({ error: "An erorr occured on the server, the relavant team has been contacted, try again later" });
    return;
  }

  await sendErrorMail(error);

  // process error from mongodb
  res.status(500).json({ message: "Internal Server Error" });
  return;
};

module.exports = {
  handleError,
};
