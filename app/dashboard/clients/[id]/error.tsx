'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Client page error]', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: 'white', fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 480,
        background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '48px 40px',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Page failed to load</h2>

        {/* Show the actual error in all environments — crucial for debugging */}
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,0.4)',
          background: 'rgba(255,255,255,0.04)', borderRadius: 8,
          padding: '10px 14px', marginBottom: 24, textAlign: 'left',
          fontFamily: 'monospace', wordBreak: 'break-word', lineHeight: 1.6,
        }}>
          {error.message || 'Unknown error'}
          {error.digest && <span style={{ display: 'block', marginTop: 6, color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>digest: {error.digest}</span>}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 22px', background: '#C9A84C', color: '#080C14',
              fontWeight: 700, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <Link href="/dashboard/clients" style={{
            padding: '10px 22px', background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13,
            borderRadius: 8, textDecoration: 'none',
          }}>
            ← Back to Clients
          </Link>
        </div>
      </div>
    </div>
  );
}
