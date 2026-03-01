/**
 * Sentry Client Configuration
 * 
 * This file configures Sentry for client-side error monitoring.
 * It captures React errors, performance data, and user interactions.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Capture Replay for sessions with errors
  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.feedbackIntegration({
      // Additional Feedback configuration goes here
      colorScheme: 'system',
    }),
  ],

  // Before sending an error, sanitize any sensitive data
  beforeSend(event) {
    // Remove potentially sensitive information
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },

  // Ignore certain errors that are not actionable
  ignoreErrors: [
    // Network errors
    'Network Error',
    'Failed to fetch',
    'Network request failed',
    // Browser extensions
    /^Non-Error promise rejection captured with value: Object Not Found Matching Id/,
    // ResizeObserver loop limit exceeded (harmless)
    'ResizeObserver loop limit exceeded',
  ],

  // Deny URLs from browser extensions
  denyUrls: [
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],
});
