'use client';

import Link from 'next/link';

const GOLD = '#C9A84C';
const FOOTER_LINKS = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Shield Pro', href: '/shield-pro' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Refund Policy', href: '/refund' },
];

export function MarketingFooter() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '40px 24px',
      background: '#080C14',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Top row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 32,
          marginBottom: 32,
        }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                Repute<span style={{ color: GOLD }}>OS</span>
              </span>
            </Link>
            <p style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.3)',
              marginTop: 8,
              maxWidth: 240,
              lineHeight: 1.6,
            }}>
              AI-powered reputation engineering for PR professionals.
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', marginTop: 8 }}>
              Operated by Lightseekers Media Private Limited
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                Product
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Pricing', '/pricing'], ['Shield Pro', '/shield-pro'], ['Sign Up', '/signup']].map(([label, href]) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                Legal
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies'], ['Refund Policy', '/refund']].map(([label, href]) => (
                  <Link key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                Contact
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['hello@reputeos.com', 'mailto:hello@reputeos.com'],
                  ['Privacy queries', 'mailto:privacy@reputeos.com'],
                  ['Billing support', 'mailto:billing@reputeos.com'],
                ].map(([label, href]) => (
                  <a key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
            © {new Date().getFullYear()} Lightseekers Media Private Limited. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>🇮🇳 Made in India</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>DPDP Act 2023 Compliant</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>IT Act 2000 Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
