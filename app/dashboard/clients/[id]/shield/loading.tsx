const BG     = '#080C14';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.12)';

function Skeleton({ w = '100%', h = 20, radius = 8 }: { w?: string | number; h?: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'rgba(255,255,255,0.04)',
      animation: 'pulse 1.6s ease-in-out infinite',
    }} />
  );
}

export default function ModuleLoading() {
  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>

      {/* Header skeleton */}
      <div style={{ marginBottom: 32 }}>
        <Skeleton w={240} h={28} radius={6} />
        <div style={{ marginTop: 8 }}><Skeleton w={320} h={16} radius={4} /></div>
      </div>

      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12,
          padding: 24, marginBottom: 16,
        }}>
          <Skeleton w={180} h={18} radius={5} />
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton h={14} />
            <Skeleton w="85%" h={14} />
            <Skeleton w="70%" h={14} />
          </div>
        </div>
      ))}
    </div>
  );
}
