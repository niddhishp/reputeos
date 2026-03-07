import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicySchema } from '@/components/seo/policy-schema';

export const metadata: Metadata = {
  title: 'Terms of Service | ReputeOS',
  description: 'ReputeOS Terms of Service — the agreement governing your use of our AI-powered reputation engineering platform.',
  alternates: { canonical: 'https://reputeos.com/terms' },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = 'March 7, 2026';
const COMPANY = 'Lightseekers Media Private Limited';
const EMAIL = 'legal@reputeos.com';

export default function TermsOfService() {
  return (
    <>
    <PolicySchema
      type="TermsOfService"
      name="ReputeOS Terms of Service"
      url="https://reputeos.com/terms"
      dateModified="2026-03-07"
    />
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
        ol{padding-left:20px;margin:0 0 14px}
        ol li{font-size:14px;line-height:1.8;color:rgba(255,255,255,0.6);margin-bottom:4px}
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
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'white', margin: '0 0 12px', lineHeight: 1.2 }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Effective Date: <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{EFFECTIVE_DATE}</strong> · <strong style={{ color: 'rgba(255,255,255,0.5)' }}>{COMPANY}</strong></p>
        </div>

        <p>Please read these Terms of Service (&quot;Terms&quot;) carefully before using ReputeOS. By creating an account or using our services, you agree to be bound by these Terms. If you do not agree, do not use the service.</p>
        <p>These Terms constitute a binding legal agreement between you (&quot;User&quot;, &quot;you&quot;) and <strong>{COMPANY}</strong> (&quot;ReputeOS&quot;, &quot;we&quot;, &quot;us&quot;).</p>

        <hr />
        {termsSections.map((s, i) => (
          <div key={i}>
            <h2>{`${i + 1}. ${s.heading}`}</h2>
            {s.content}
            {i < termsSections.length - 1 && <hr />}
          </div>
        ))}

        <div style={{ marginTop: 48, padding: '24px 28px', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Legal questions: <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies'], ['Refund Policy', '/refund']].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{label}</Link>
          ))}
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} {COMPANY}. All rights reserved.</p>
      </div>
    </div>
    </>
  );
}

const termsSections: { heading: string; content: React.ReactNode }[] = [
  {
    heading: 'The Service',
    content: <>
      <p>ReputeOS is an AI-powered B2B SaaS platform that enables PR consultants, agencies, and communications professionals to discover, diagnose, position, express, validate, and protect the reputations of their clients (&quot;the Service&quot;).</p>
      <p>The Service is available on subscription plans described at <Link href="/pricing">reputeos.com/pricing</Link>. Feature availability depends on your active plan.</p>
    </>,
  },
  {
    heading: 'Account Registration',
    content: <>
      <ul>
        <li>You must be at least 18 years old and have the legal authority to enter into contracts</li>
        <li>You must provide accurate, current, and complete information during registration</li>
        <li>You are responsible for maintaining the confidentiality of your login credentials</li>
        <li>You are responsible for all activity that occurs under your account</li>
        <li>Notify us immediately at <a href="mailto:security@reputeos.com">security@reputeos.com</a> if you suspect unauthorised access</li>
        <li>You may not share, sell, or transfer your account to another person</li>
      </ul>
    </>,
  },
  {
    heading: 'Acceptable Use',
    content: <>
      <p>You agree to use ReputeOS only for lawful purposes and in accordance with these Terms. You agree <strong>not</strong> to:</p>
      <ul>
        <li>Use the Service to generate defamatory, harassing, or fraudulent content about any individual</li>
        <li>Process data about individuals without their knowledge or required consent</li>
        <li>Attempt to reverse-engineer, scrape, or extract our AI models or proprietary algorithms</li>
        <li>Share your API access or account credentials with third parties</li>
        <li>Use the Service to create spam, phishing, or deceptive content</li>
        <li>Circumvent rate limits, subscription restrictions, or security controls</li>
        <li>Use the Service to violate any applicable Indian or international law</li>
        <li>Attempt to probe, scan, or test the vulnerability of our systems</li>
      </ul>
      <p>We reserve the right to suspend or terminate accounts that violate these terms without notice or refund.</p>
    </>,
  },
  {
    heading: 'Subscriptions & Billing',
    content: <>
      <p><strong>Plans:</strong> ReputeOS offers Solo, Agency, and Enterprise subscription plans billed monthly. Prices are displayed in INR at <Link href="/pricing">reputeos.com/pricing</Link>.</p>
      <p><strong>Free Trial:</strong> New accounts receive a 14-day trial on the Solo plan. No credit card is required to start a trial. At the end of the trial, you must subscribe to continue using the Service.</p>
      <p><strong>Billing:</strong> Subscriptions renew automatically on your billing date. You authorise us to charge your payment method on file via Stripe.</p>
      <p><strong>Scan Credits:</strong> Each plan includes a monthly scan credit allowance. Unused monthly credits do not roll over. Purchased credit packs never expire.</p>
      <p><strong>Price Changes:</strong> We will give at least 30 days&apos; notice before increasing prices. Continued use after the effective date constitutes acceptance.</p>
      <p><strong>Cancellation:</strong> You may cancel anytime from Settings → Billing. Cancellation takes effect at the end of the current billing period. See our <Link href="/refund">Refund Policy</Link> for refund eligibility.</p>
    </>,
  },
  {
    heading: 'Intellectual Property',
    content: <>
      <h3>Our IP</h3>
      <p>ReputeOS, its software, algorithms, design, brand, and LSI methodology are owned by {COMPANY}. You receive a limited, non-exclusive, non-transferable licence to use the Service during your subscription.</p>
      <h3>Your Content & Client Data</h3>
      <p>You retain all rights to the content you create using ReputeOS (posts, reports, analyses). You grant us a limited licence to process your inputs to deliver the Service.</p>
      <p>You represent and warrant that you have all necessary rights and consents to input your clients&apos; data into the platform.</p>
      <h3>AI-Generated Content</h3>
      <p>Content generated by our AI tools is provided to you for your use. You are responsible for reviewing, editing, and ensuring any published content is accurate and compliant with applicable laws.</p>
    </>,
  },
  {
    heading: 'Data & Privacy',
    content: <>
      <p>Your use of the Service is also governed by our <Link href="/privacy">Privacy Policy</Link>, which is incorporated into these Terms by reference. By using the Service, you also agree to the Privacy Policy.</p>
      <p>You are the data principal for your own personal data and the data fiduciary for your clients&apos; data that you upload to the platform. You warrant compliance with the DPDP Act 2023 in your collection and use of client data.</p>
    </>,
  },
  {
    heading: 'Disclaimers & Limitation of Liability',
    content: <>
      <h3>No Guarantees</h3>
      <p>ReputeOS provides analysis, insights, and AI-generated content as tools to assist reputation management professionals. We do not guarantee specific outcomes, LSI score improvements, media coverage, or business results.</p>
      <h3>Service Availability</h3>
      <p>We aim for 99.5% uptime but do not guarantee uninterrupted service. Scheduled maintenance, third-party API outages, and force majeure events may cause downtime. We will communicate planned outages in advance where possible.</p>
      <h3>Limitation of Liability</h3>
      <p>To the maximum extent permitted by Indian law, our total cumulative liability to you for any claims arising from these Terms or the Service shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
      <p>We shall not be liable for indirect, incidental, consequential, or punitive damages including lost profits, data loss, or reputational harm.</p>
    </>,
  },
  {
    heading: 'Third-Party Services',
    content: <>
      <p>The Service integrates with third-party APIs (Stripe, LinkedIn, SerpAPI, OpenRouter, etc.). Your use of those services is governed by their respective terms. We are not responsible for their availability, accuracy, or changes to their pricing.</p>
    </>,
  },
  {
    heading: 'Governing Law & Dispute Resolution',
    content: <>
      <p>These Terms are governed by the laws of India. Any disputes shall first be attempted to be resolved through good-faith negotiation.</p>
      <p>If negotiation fails within 30 days, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, with a sole arbitrator appointed by mutual consent. The seat of arbitration shall be Mumbai, Maharashtra. The language of arbitration shall be English.</p>
      <p>The courts of Mumbai shall have exclusive jurisdiction for any matters not subject to arbitration.</p>
    </>,
  },
  {
    heading: 'Termination',
    content: <>
      <p>Either party may terminate the agreement with 30 days&apos; notice. We may suspend or terminate your account immediately for material breach of these Terms, non-payment, or if required by law.</p>
      <p>Upon termination, your access ceases and your data will be retained for 90 days before deletion, during which you may export your data. After 90 days, all data is permanently deleted.</p>
    </>,
  },
  {
    heading: 'Changes to Terms',
    content: <>
      <p>We may modify these Terms at any time. We will notify you via email at least 14 days before material changes take effect. Continued use after the effective date constitutes acceptance. For minor changes (typo fixes, clarifications), we may update without notice.</p>
    </>,
  },
];
