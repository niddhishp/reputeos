import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'ReputeOS — Strategic Reputation Engineering';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #080C14 0%, #0D1520 50%, #111827 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Gold top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #C9A84C 0%, #E8C97A 50%, #C9A84C 100%)',
          }}
        />

        {/* Top row: Logo + LSI badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Icon */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              🛡️
            </div>
            <span style={{ color: '#F9FAFB', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              ReputeOS
            </span>
          </div>
          <div
            style={{
              background: 'rgba(201, 168, 76, 0.15)',
              border: '1px solid rgba(201, 168, 76, 0.4)',
              borderRadius: '100px',
              padding: '8px 20px',
              color: '#C9A84C',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            Strategic Reputation Engineering
          </div>
        </div>

        {/* Main headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              color: '#F9FAFB',
              fontSize: '62px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              maxWidth: '780px',
            }}
          >
            Your Reputation Has a Number.
          </div>
          <div
            style={{
              color: '#C9A84C',
              fontSize: '62px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
            }}
          >
            Find It. Engineer It.
          </div>
          <div
            style={{
              color: '#9CA3AF',
              fontSize: '22px',
              fontWeight: 400,
              marginTop: '8px',
              maxWidth: '680px',
              lineHeight: 1.5,
            }}
          >
            LSI scoring · 54 archetypes · NLP-validated content · Statistical proof of improvement
          </div>
        </div>

        {/* Bottom row: 6 module pills */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['DISCOVER', 'DIAGNOSE', 'POSITION', 'EXPRESS', 'VALIDATE', 'SHIELD'].map((module, i) => (
            <div
              key={module}
              style={{
                background: i === 2 ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.06)',
                border: i === 2 ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 18px',
                color: i === 2 ? '#C9A84C' : '#9CA3AF',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '1px',
              }}
            >
              {module}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
