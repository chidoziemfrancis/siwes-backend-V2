/**
 * Bot/headless browser detection middleware.
 * Detects automation tools like Puppeteer, Playwright, Selenium, PhantomJS.
 * Server-side checks based on HTTP headers - automation tools often have telltale signatures.
 */
const SENTRY_DSN = process.env.SENTRY_DSN;

// Known automation/bot signatures in User-Agent (conservative list to avoid false positives)
const BOT_SIGNATURES = [
  "headlesschrome",
  "headless",
  "phantomjs",
  "selenium",
  "puppeteer",
  "playwright",
  "webdriver",
  "scrapy",
  "curl",
  "wget",
  "python-requests",
  "got/",
  "node-fetch",
];

// Paths to skip bot detection (health checks, docs, webhooks that use curl, etc.)
const SKIP_PATHS = ["/api/health", "/api/render", "/api-docs", "/reference"];

function isLikelyBot(req) {
  const path = (req.path || req.url || "").split("?")[0];
  if (SKIP_PATHS.some((p) => path.startsWith(p) || path === p)) {
    return false;
  }

  const ua = (req.get("user-agent") || "").toLowerCase();
  const secChUa = (req.get("sec-ch-ua") || "").toLowerCase();
  const acceptLanguage = req.get("accept-language");
  const accept = req.get("accept");

  // 1. User-Agent contains known automation signatures
  if (BOT_SIGNATURES.some((sig) => ua.includes(sig))) {
    return { reason: "user_agent", value: ua.substring(0, 80) };
  }

  // 2. sec-ch-ua (Client Hints) often exposes HeadlessChrome
  if (secChUa && secChUa.includes("headlesschrome")) {
    return { reason: "sec_ch_ua", value: secChUa };
  }

  // 3. Chrome-like UA but missing Accept-Language (common in headless)
  if (ua.includes("chrome") && !ua.includes("chromium") && !acceptLanguage) {
    return { reason: "missing_accept_language", value: "chrome_without_lang" };
  }

  // 4. Missing or empty User-Agent
  if (!ua || ua.length < 10) {
    return { reason: "empty_user_agent", value: "empty" };
  }

  // 5. Missing Accept header (real browsers almost always send it)
  if (!accept && path.startsWith("/api")) {
    return { reason: "missing_accept", value: "empty" };
  }

  return null;
}

/**
 * Middleware that blocks requests from detected bots.
 * Logs to Sentry when SENTRY_DSN is set.
 */
function blockBots(req, res, next) {
  const result = isLikelyBot(req);
  if (result) {
    if (SENTRY_DSN) {
      const Sentry = require("@sentry/node");
      Sentry.captureMessage("Bot/headless browser detected", {
        level: "warning",
        extra: {
          reason: result.reason,
          value: result.value,
          ip: req.ip,
          path: req.path,
          method: req.method,
        },
      });
    }
    return res.status(403).json({
      success: false,
      message: "Access denied. Automated requests are not permitted.",
    });
  }
  next();
}

/**
 * Middleware that flags but does not block - useful for logging/analytics.
 * Attaches req.isLikelyBot for downstream use.
 */
function flagBots(req, res, next) {
  req.isLikelyBot = isLikelyBot(req);
  next();
}

module.exports = {
  blockBots,
  flagBots,
  isLikelyBot,
};
