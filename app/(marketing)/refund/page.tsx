import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy | ReputeOS',
  description: 'ReputeOS Refund & Cancellation Policy — when you can get a refund and how to request one.',
  alternates: { canonical: 'https://reputeos.com/refund' },
  robots: { index: true, follow: true },
};

export default function RefundPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: '#080C14', color: 'white', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        a{color:#C9A84C;text-decoration:none} a:hover{text-decoration:underline}
        h2{font-size:18px;font-weight:600;color:white;margin:36px 0 14px}
        h3{font-size:15px;font-weight:600;color:rgba(255,255,255,0.85);margin:20px 0 10px}
        p{font-size:14px;line-height:1.8;color:rgba(255,255,255,0.6);margin:0 0 12px}
        ul{padding-left:20px;margin:0 0 14px}
        li{font-size:14px;line-height:1.8;color:rgba(255,255,255,0.6);margin-bottom:4px}
        strong{color:rgba(255,255,255,0.85);font-weight:600}
        hr{border:none;border-top:1px solid rgba(201,168,76,0.1);margin:32px 0}
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
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'white', margin: '0 0 12px', lineHeight: 1.2 }}>Refund & Cancellation Policy</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Effective Date: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>March 7, 2026</strong></p>
        </div>

        <p>We want you to be completely satisfied with ReputeOS. This policy explains when refunds are available and how to request them. It complies with the <strong>Consumer Protection Act, 2019</strong> and standard Indian e-commerce regulations.</p>

        <hr />

        <h2>1. Free Trial</h2>
        <p>All new accounts receive a <strong>14-day free trial</strong> on the Solo plan with no credit card required. We strongly encourage you to evaluate the platform fully during the trial before subscribing.</p>

        <hr />

        <h2>2. Subscription Refunds</h2>

        <h3>Monthly Subscriptions</h3>
        <ul>
          <li><strong>First payment (within 7 days):</strong> If you subscribed but have not used the Service (zero discovery scans run, zero content generated), you are eligible for a full refund within 7 days of your first payment.</li>
          <li><strong>After 7 days or after usage:</strong> No refund is available for the current billing period. You may cancel to prevent future charges.</li>
          <li><strong>Accidental charges:</strong> If you were charged due to a technical error on our side, we will refund the full amount without question.</li>
        </ul>

        <h3>Annual Plans</h3>
        <p>We currently offer monthly billing only. Annual plans, if introduced, will have their own refund terms stated at time of purchase.</p>

        <hr />

        <h2>3. Add-On Refunds</h2>

        <h3>Scan Credit Packs (One-Time)</h3>
        <p>Scan credit packs are <strong>non-refundable</strong> once purchased, as credits are immediately available in your account. Unused credits remain valid indefinitely — they do not expire.</p>

        <h3>Shield Pro Add-On (Monthly)</h3>
        <p>Same policy as monthly subscriptions: 7-day refund window if unused.</p>

        <h3>Expert Onboarding (One-Time)</h3>
        <p>The onboarding session fee is non-refundable once the session has been scheduled. If you need to reschedule, contact us at least 24 hours in advance at <a href="mailto:hello@reputeos.com">hello@reputeos.com</a>.</p>

        <hr />

        <h2>4. Cancellation</h2>
        <p>You may cancel your subscription at any time from:</p>
        <p><strong>Settings → Billing → Manage Billing → Cancel Plan</strong></p>
        <p>Cancellation takes effect at the end of your current billing period. You retain full access until the period ends. After cancellation:</p>
        <ul>
          <li>Your data is retained for 90 days — export everything you need</li>
          <li>After 90 days, all data is permanently deleted</li>
          <li>You can reactivate at any time with a new subscription</li>
        </ul>

        <hr />

        <h2>5. Circumstances Beyond Our Control</h2>
        <p>We use third-party APIs (SerpAPI, OpenRouter, Firecrawl, etc.) to deliver discovery scans. Occasional service degradation may occur due to upstream provider outages. In such cases:</p>
        <ul>
          <li>Scan credits consumed during failed scans are automatically restored</li>
          <li>We do not offer refunds for temporary third-party API outages</li>
          <li>Prolonged outages (&gt;48 hours affecting core functionality) will be handled on a case-by-case basis</li>
        </ul>

        <hr />

        <h2>6. How to Request a Refund</h2>
        <p>Email <a href="mailto:billing@reputeos.com">billing@reputeos.com</a> with:</p>
        <ul>
          <li>Subject: <strong>Refund Request — [your email]</strong></li>
          <li>Your registered email address</li>
          <li>The charge date and amount</li>
          <li>Reason for the refund request</li>
        </ul>
        <p>We will respond within <strong>2 business days</strong>. Approved refunds are processed within 5–7 business days and appear on your statement within 7–10 business days depending on your bank.</p>

        <hr />

        <h2>7. Disputes</h2>
        <p>If you believe you have been incorrectly charged, please contact us before initiating a chargeback. We resolve billing disputes quickly and fairly. Chargebacks that are later found to be invalid may result in account suspension.</p>

        <div style={{ marginTop: 48, padding: '24px 28px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Our commitment:</strong> We would rather give you a refund than have an unhappy customer. If something isn&apos;t working for you, email us first — we may be able to solve the problem.
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
