// Small helper to initialize Sentry (optional)
module.exports = function initSentry() {
  if (!process.env.SENTRY_DSN) return;
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    console.log('Sentry initialized');
  } catch (e) {
    console.warn('Sentry not installed');
  }
};