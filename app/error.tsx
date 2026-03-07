'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring service when available (e.g. Sentry)
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080C14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{ fontSize: 64, color: '#C9A84C', lineHeight: 1 }}>⚠</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Something went wrong</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
        An unexpected error occurred. Our team has been notified.
        {error?.digest && (
          <span style={{ display: 'block', marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            Error ID: {error.digest}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={reset}
          style={{
            padding: '11px 24px',
            background: '#C9A84C',
            color: '#080C14',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a
          href="/dashboard/clients"
          style={{
            padding: '11px 24px',
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            border: '1px solid rgba(255,255,255,0.1)',
            textDecoration: 'none',
          }}
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
