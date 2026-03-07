import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicySchema } from '@/components/seo/policy-schema';

export const metadata: Metadata = {
  title: 'Privacy Policy | ReputeOS',
  description: 'ReputeOS Privacy Policy — how we collect, use, and protect your personal data under the Digital Personal Data Protection Act 2023 (India) and IT Act 2000.',
  alternates: { canonical: 'https://reputeos.com/privacy' },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = 'March 7, 2026';
const COMPANY = 'ReputeOS (operated by Lightseekers Media Private Limited)';
const EMAIL = 'privacy@reputeos.com';
const ADDRESS = 'Mumbai, Maharashtra, India';

export default function PrivacyPolicy() {
  return <>
    <PolicySchema
      type="PrivacyPolicy"
      name="ReputeOS Privacy Policy"
      url="https://reputeos.com/privacy"
      dateModified="2026-03-07"
    />
    <PolicyPage title="Privacy Policy" effectiveDate={EFFECTIVE_DATE} sections={privacySections} />
  </>;
}

// ─── Shared layout component ────────────────────────────────────────────────
function PolicyPage({ title, effectiveDate, sections }: {
  title: string;
  effectiveDate: string;
  sections: { heading: string; content: React.ReactNode }[];
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#080C14', color: 'white', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        a { color: #C9A84C; text-decoration: none; }
        a:hover { text-decoration: underline; }
        h2 { font-size: 18px; font-weight: 600; color: white; margin: 36px 0 14px; }
        h3 { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.85); margin: 20px 0 10px; }
        p { font-size: 14px; line-height: 1.8; color: rgba(255,255,255,0.6); margin: 0 0 12px; }
        ul { padding-left: 20px; margin: 0 0 14px; }
        li { font-size: 14px; line-height: 1.8; color: rgba(255,255,255,0.6); margin-bottom: 4px; }
        strong { color: rgba(255,255,255,0.85); font-weight: 600; }
        hr { border: none; border-top: 1px solid rgba(201,168,76,0.1); margin: 32px 0; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { text-align: left; font-size: 12px; font-weight: 600; color: #C9A84C; padding: 10px 14px; background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.1); text-transform: uppercase; letter-spacing: 0.05em; }
        td { font-size: 13px; color: rgba(255,255,255,0.6); padding: 10px 14px; border: 1px solid rgba(255,255,255,0.06); vertical-align: top; }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
          Repute<span style={{ color: '#C9A84C' }}>OS</span>
        </Link>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Privacy</Link>
          <Link href="/terms" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Terms</Link>
          <Link href="/cookies" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Cookies</Link>
          <Link href="/refund" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Refunds</Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', fontSize: 11, color: '#C9A84C', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
            Legal
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'white', margin: '0 0 12px', lineHeight: 1.2 }}>{title}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Effective Date: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{effectiveDate}</strong>
            &nbsp;·&nbsp; Operated by: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{COMPANY}</strong>
          </p>
        </div>

        {/* Sections */}
        {sections.map((s, i) => (
          <div key={i}>
            <h2>{`${i + 1}. ${s.heading}`}</h2>
            {s.content}
            {i < sections.length - 1 && <hr />}
          </div>
        ))}

        {/* Contact box */}
        <div style={{ marginTop: 48, padding: '24px 28px', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            Questions about this policy? Contact our Privacy Officer at{' '}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            {' '}or write to us at: {ADDRESS}.
          </p>
        </div>
      </div>

      {/* Footer links */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies'], ['Refund Policy', '/refund']].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{label}</Link>
          ))}
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} Lightseekers Media Private Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ─── Privacy Policy Sections ─────────────────────────────────────────────────
const privacySections: { heading: string; content: React.ReactNode }[] = [
  {
    heading: 'Overview & Legal Basis',
    content: <>
      <p>ReputeOS is operated by <strong>Lightseekers Media Private Limited</strong>, incorporated in India. This Privacy Policy applies to users of <strong>reputeos.com</strong> and all associated services.</p>
      <p>We process personal data under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the <strong>Information Technology Act, 2000</strong>, and the <strong>Information Technology (Reasonable Security Practices) Rules, 2011</strong>.</p>
      <p>By using ReputeOS, you consent to data processing as described in this policy. If you do not agree, please discontinue use and contact us to delete your data.</p>
    </>,
  },
  {
    heading: 'Data We Collect',
    content: <>
      <table>
        <thead><tr><th>Category</th><th>Data Points</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td><strong>Account Data</strong></td><td>Name, email address, company name, role</td><td>Authentication, service delivery</td></tr>
          <tr><td><strong>Client Profile Data</strong></td><td>Names, LinkedIn URLs, keywords, industry, biographical info you input for your clients</td><td>Running reputation scans and generating reports</td></tr>
          <tr><td><strong>Usage Data</strong></td><td>Pages visited, features used, scan history, content generated</td><td>Product improvement, billing, support</td></tr>
          <tr><td><strong>Payment Data</strong></td><td>Billing name, last 4 digits of card, transaction ID (via Stripe)</td><td>Billing. We never store full card numbers.</td></tr>
          <tr><td><strong>Technical Data</strong></td><td>IP address, browser type, device type, cookies</td><td>Security, analytics, fraud prevention</td></tr>
          <tr><td><strong>Third-Party Content</strong></td><td>Publicly available web mentions, news articles, social posts about your clients</td><td>Reputation analysis (core product function)</td></tr>
        </tbody>
      </table>
      <p>We do <strong>not</strong> collect sensitive personal data (Aadhaar numbers, financial account details, health data, biometric data) unless explicitly required and consented to.</p>
    </>,
  },
  {
    heading: 'How We Use Your Data',
    content: <>
      <ul>
        <li><strong>Service Delivery:</strong> Running discovery scans, calculating LSI scores, generating content and reports</li>
        <li><strong>Account Management:</strong> Login, subscription management, billing communications</li>
        <li><strong>Product Improvement:</strong> Aggregated, anonymised analytics to improve our AI models and features</li>
        <li><strong>Security:</strong> Detecting fraud, abuse, and unauthorised access</li>
        <li><strong>Legal Compliance:</strong> Responding to lawful government or court orders under Indian law</li>
        <li><strong>Communications:</strong> Product updates, invoices, critical service notices (not marketing without consent)</li>
      </ul>
      <p>We do <strong>not</strong> sell your data, your clients' data, or scan results to any third party.</p>
    </>,
  },
  {
    heading: 'Third-Party Services & Data Sharing',
    content: <>
      <p>To deliver our service, we share minimal data with these processors:</p>
      <table>
        <thead><tr><th>Service</th><th>Purpose</th><th>Data Shared</th><th>Location</th></tr></thead>
        <tbody>
          <tr><td>Supabase</td><td>Database & authentication</td><td>All platform data</td><td>US (AWS)</td></tr>
          <tr><td>Stripe</td><td>Payment processing</td><td>Email, billing info</td><td>US</td></tr>
          <tr><td>OpenRouter / Anthropic</td><td>AI content generation</td><td>Content prompts (no PII)</td><td>US</td></tr>
          <tr><td>SerpAPI / Exa.ai</td><td>Web search for discovery</td><td>Search queries (client names)</td><td>US</td></tr>
          <tr><td>Vercel</td><td>Hosting & deployment</td><td>Request logs (IP, headers)</td><td>US/Global</td></tr>
          <tr><td>LinkedIn</td><td>OAuth & social publishing</td><td>OAuth token (your consent)</td><td>US</td></tr>
        </tbody>
      </table>
      <p>All processors are contractually bound to handle data per applicable privacy laws. Where data is transferred outside India, we rely on standard contractual clauses and adequacy determinations.</p>
    </>,
  },
  {
    heading: 'Client Data & Confidentiality',
    content: <>
      <p>ReputeOS is a B2B platform. When you add client profiles to our system, you represent that you have the legal right and necessary consents to process that individual's data for reputation analysis purposes.</p>
      <p>Scan results, LSI scores, content, and reports generated about your clients are <strong>exclusively accessible by you</strong>. We do not share client-specific data between users or use it to train AI models without anonymisation.</p>
      <p>If a data subject (your client) requests access, correction, or deletion of their data from our systems, please contact us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a> and we will action it within 30 days.</p>
    </>,
  },
  {
    heading: 'Data Retention',
    content: <>
      <ul>
        <li><strong>Active accounts:</strong> Data retained for duration of subscription plus 90 days post-cancellation</li>
        <li><strong>Deleted accounts:</strong> Personal data purged within 30 days of deletion request</li>
        <li><strong>Scan results:</strong> Retained for 12 months, then automatically deleted unless you export them</li>
        <li><strong>Payment records:</strong> Retained for 7 years per Indian financial regulations</li>
        <li><strong>Logs:</strong> Security logs retained for 90 days; access logs for 30 days</li>
      </ul>
    </>,
  },
  {
    heading: 'Your Rights (DPDP Act 2023)',
    content: <>
      <p>Under the Digital Personal Data Protection Act 2023, you have the following rights:</p>
      <ul>
        <li><strong>Right to Access:</strong> Request a copy of personal data we hold about you</li>
        <li><strong>Right to Correction:</strong> Correct inaccurate or incomplete personal data</li>
        <li><strong>Right to Erasure:</strong> Request deletion of your personal data (subject to legal retention obligations)</li>
        <li><strong>Right to Grievance Redressal:</strong> Lodge a complaint with our Data Protection Officer</li>
        <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time; this will not affect the lawfulness of prior processing</li>
        <li><strong>Right to Nominate:</strong> Nominate another person to exercise rights on your behalf in case of incapacity</li>
      </ul>
      <p>To exercise any right, email <a href={`mailto:${EMAIL}`}>{EMAIL}</a> with subject line "DPDP Request — [your right]". We will respond within 30 days.</p>
    </>,
  },
  {
    heading: 'Security',
    content: <>
      <p>We implement reasonable security practices under the IT (Reasonable Security Practices) Rules, 2011, including:</p>
      <ul>
        <li>TLS 1.3 encryption for all data in transit</li>
        <li>AES-256 encryption for data at rest in Supabase</li>
        <li>Row-Level Security (RLS) ensuring users can only access their own data</li>
        <li>API key authentication with rate limiting on all endpoints</li>
        <li>Admin access restricted by role-based controls</li>
        <li>Regular security audits and dependency updates</li>
      </ul>
      <p>If you discover a security vulnerability, please disclose responsibly to <a href="mailto:security@reputeos.com">security@reputeos.com</a>.</p>
    </>,
  },
  {
    heading: 'Cookies',
    content: <>
      <p>We use essential cookies for authentication and session management. See our <Link href="/cookies">Cookie Policy</Link> for full details. You can manage cookie preferences from your browser settings.</p>
    </>,
  },
  {
    heading: 'Changes to This Policy',
    content: <>
      <p>We may update this policy to reflect changes in our practices or applicable law. We will notify you via email at least 14 days before material changes take effect. Continued use of the service after that date constitutes acceptance of the updated policy.</p>
    </>,
  },
  {
    heading: 'Grievance Officer',
    content: <>
      <p>In accordance with the Information Technology Act, 2000 and the DPDP Act 2023, the details of our Grievance Officer are:</p>
      <p><strong>Name:</strong> Niddhish P<br /><strong>Email:</strong> <a href={`mailto:${EMAIL}`}>{EMAIL}</a><br /><strong>Address:</strong> {ADDRESS}<br /><strong>Response Time:</strong> Within 30 days of receipt of grievance</p>
    </>,
  },
];
