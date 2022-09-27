const { response } = require('express');

/**
 * Transforms and send back a readable error message to the frontend client
 * @param {Error} error 
 * @param {response} res 
 */
const handleError = async function (error, res) {
  // process error from mongodb schema validation
  if (error.name === 'ValidationError') {

    // get all validation errors
    const validationErrors = Object.values(error.errors).map(err => err.message);

    // send error to client
    return res.status(400).json({
      'message': 'Bad Request',
      'errors': validationErrors
    });
  }

  // process error from mongodb duplicate key
  if (error.code === 11000) {
    return res.status(400).json({ 'message': 'Email already exists' });
  }

  // process error from mongodb
  return res.status(500).json({ 'message': 'Internal Server Error' });
}

module.exports = {
  handleError
}