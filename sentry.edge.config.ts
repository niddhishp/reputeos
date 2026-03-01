/**
 * Sentry Edge Configuration
 * 
 * This file configures Sentry for edge runtime (middleware, edge API routes).
 */

import * as Sentry from '@sentry/nextjs';


Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Before sending an error, sanitize any sensitive data
  beforeSend(event) {
    // Remove potentially sensitive information
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
});
