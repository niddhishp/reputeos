import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | ReputeOS',
  description: 'ReputeOS Cookie Policy — what cookies we use, why, and how to control them.',
  alternates: { canonical: 'https://reputeos.com/cookies' },
  robots: { index: true, follow: true },
};

export default function CookiePolicy() {
  return (
    <div style={{ minHeight: '100vh', background: '#080C14', color: 'white', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        a{color:#C9A84C;text-decoration:none} a:hover{text-decoration:underline}
        h2{font-size:18px;font-weight:600;color:white;margin:36px 0 14px}
        p{font-size:14px;line-height:1.8;color:rgba(255,255,255,0.6);margin:0 0 12px}
        ul{padding-left:20px;margin:0 0 14px}
        li{font-size:14px;line-height:1.8;color:rgba(255,255,255,0.6);margin-bottom:4px}
        strong{color:rgba(255,255,255,0.85);font-weight:600}
        hr{border:none;border-top:1px solid rgba(201,168,76,0.1);margin:32px 0}
        table{width:100%;border-collapse:collapse;margin:16px 0}
        th{text-align:left;font-size:12px;font-weight:600;color:#C9A84C;padding:10px 14px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.1);text-transform:uppercase;letter-spacing:0.05em}
        td{font-size:13px;color:rgba(255,255,255,0.6);padding:10px 14px;border:1px solid rgba(255,255,255,0.06);vertical-align:top}
      `}</style>

      <nav style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>Repute<span style={{ color: '#C9A84C' }}>OS</span></Link>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies'], ['Refunds', '/refund']].map(([l, h]) => <Link key={h} href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{l}</Link>)}
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', fontSize: 11, color: '#C9A84C', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>Legal</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'white', margin: '0 0 12px', lineHeight: 1.2 }}>Cookie Policy</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Effective Date: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>March 7, 2026</strong></p>
        </div>

        <p>This Cookie Policy explains what cookies are, how ReputeOS uses them, and your choices. Read our <Link href="/privacy">Privacy Policy</Link> for broader information on how we handle your data.</p>

        <hr />

        <h2>1. What Are Cookies?</h2>
        <p>Cookies are small text files stored on your device when you visit a website. They allow the site to remember your preferences, keep you logged in, and understand how you use the service. Cookies cannot execute code or contain viruses.</p>

        <hr />

        <h2>2. Cookies We Use</h2>
        <table>
          <thead><tr><th>Cookie</th><th>Type</th><th>Purpose</th><th>Duration</th></tr></thead>
          <tbody>
            <tr><td><strong>sb-access-token</strong></td><td>Essential</td><td>Supabase authentication — keeps you logged in</td><td>1 hour (auto-refreshed)</td></tr>
            <tr><td><strong>sb-refresh-token</strong></td><td>Essential</td><td>Supabase session refresh — prevents re-login</td><td>60 days</td></tr>
            <tr><td><strong>li_oauth_state</strong></td><td>Essential</td><td>LinkedIn OAuth CSRF protection — set during LinkedIn connect, deleted after</td><td>10 minutes</td></tr>
            <tr><td><strong>__stripe_mid</strong></td><td>Functional</td><td>Stripe fraud prevention and payment security</td><td>1 year</td></tr>
            <tr><td><strong>__stripe_sid</strong></td><td>Functional</td><td>Stripe session identifier for checkout</td><td>30 minutes</td></tr>
          </tbody>
        </table>

        <p>We currently use <strong>no tracking cookies, no advertising cookies, and no third-party analytics cookies.</strong> We do not use Google Analytics or Facebook Pixel.</p>

        <hr />

        <h2>3. Essential vs. Optional Cookies</h2>
        <p><strong>Essential cookies</strong> are required for the platform to function. Without them, you cannot log in or use the Service. You cannot opt out of essential cookies while using ReputeOS.</p>
        <p><strong>Functional cookies</strong> (Stripe) are required to process payments securely. They are set only when you interact with billing features.</p>
        <p>We do not set any optional or preference-based cookies at this time.</p>

        <hr />

        <h2>4. How to Control Cookies</h2>
        <p>You can control cookies through your browser settings:</p>
        <ul>
          <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
          <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies</li>
        </ul>
        <p>Note: Blocking essential cookies will prevent you from logging in and using the Service.</p>

        <hr />

        <h2>5. Local Storage</h2>
        <p>In addition to cookies, we use browser <strong>localStorage</strong> to store UI preferences (e.g., sidebar state) on your device. This data never leaves your browser and is not transmitted to our servers.</p>

        <hr />

        <h2>6. Changes to This Policy</h2>
        <p>If we introduce new cookies, we will update this policy and notify users at least 14 days in advance for any cookies that are not strictly essential.</p>

        <hr />

        <h2>7. Contact</h2>
        <p>Cookie questions: <a href="mailto:privacy@reputeos.com">privacy@reputeos.com</a></p>

        <div style={{ marginTop: 48, padding: '24px 28px', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Our cookie philosophy:</strong> We only use what we must. No tracking. No advertising. No third-party surveillance. Your data stays on our platform.
          </p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies'], ['Refund Policy', '/refund']].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{label}</Link>
          ))}
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} Lightseekers Media Private Limited. All rights reserved.</p>
      </div>
    </div>
  );
}
