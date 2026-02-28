'use client';

/**
 * Global Error Boundary
 * 
 * This component catches errors that occur during React rendering.
 * It displays a user-friendly error page and reports the error to Sentry.
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Report error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
      extra: {
        errorDigest: error.digest,
        errorMessage: error.message,
        errorStack: error.stack,
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error caught:', error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-error-600" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Something went wrong
          </h1>

          {/* Error Description */}
          <p className="text-neutral-600 mb-6">
            We apologize for the inconvenience. Our team has been notified and is working to fix the issue.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-neutral-100 rounded-lg text-left overflow-auto">
              <p className="text-xs font-mono text-neutral-500 mb-1">Error:</p>
              <p className="text-sm font-mono text-error-600 break-words">
                {error.message}
              </p>
              {error.digest && (
                <>
                  <p className="text-xs font-mono text-neutral-500 mt-2 mb-1">Digest:</p>
                  <p className="text-sm font-mono text-neutral-700">{error.digest}</p>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link href="/">
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </Button>
          </div>

          {/* Support Link */}
          <p className="mt-6 text-sm text-neutral-500">
            Need help?{' '}
            <a
              href="mailto:support@reputeos.com"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
