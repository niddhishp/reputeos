import Link from 'next/link';

export default function NotFound() {
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
      <div style={{ fontSize: 96, fontWeight: 800, color: '#C9A84C', lineHeight: 1 }}>404</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Page not found</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </div>
      <Link
        href="/dashboard/clients"
        style={{
          marginTop: 16,
          padding: '12px 28px',
          background: '#C9A84C',
          color: '#080C14',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 14,
          textDecoration: 'none',
          letterSpacing: 0.3,
        }}
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
