// This file must be imported/required at the top of your entry file (app.js)
// before any other imports to ensure Sentry is initialized early

require("dotenv").config();

const Sentry = require("@sentry/node");

// Initialize Sentry (only if DSN is provided)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [
      // Automatically instrument Express.js, HTTP, and other integrations
      Sentry.expressIntegration(),
    ],
  });
  console.log("Sentry initialized successfully");
} else {
  console.log("Sentry DSN not provided, error tracking disabled");
}
