/**
 * Next.js Instrumentation
 * 
 * This file is used to register instrumentation hooks for the application.
 * It's called when the Next.js server starts.
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Register Sentry for the appropriate runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
