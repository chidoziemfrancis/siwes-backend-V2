const { response } = require("express");

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
    return res.status(400).json({
      message: "Bad Request",
      errors: validationErrors,
    });
  }

  // process error from mongodb duplicate key
  if (error.code === 11000) {
    let duplicateField = Object.keys(error.keyPattern)[0];
    return res
      .status(400)
      .json({ message: `${duplicateField} already exists` });
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
  }

  console.log(error);
  // process error from mongodb
  return res.status(500).json({ message: "Internal Server Error" });
};

module.exports = {
  handleError,
};
