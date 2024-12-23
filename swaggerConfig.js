const swaggerJSDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OTP API",
      version: "1.0.0",
      description: "API for sending and verifying OTPs",
    },
    servers: [
      {
        url: "http://localhost:3000/api/auth",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
