// app/(marketing)/pricing/page.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Shield, Check, ArrowRight, Zap } from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';

const TIERS = [
  {
    id: 'individual',
    name: 'Individual',
    tagline: 'For executives managing their own reputation',
    usd: 29,
    inr: 2400,
    period: 'month',
    trialDays: 14,
    highlight: false,
    cta: 'Start 14-day free trial',
    features: [
      '1 profile (yours only)',
      'Monthly Discovery scan',
      'LSI scoring & gap analysis',
      'Archetype selection (12 core archetypes)',
      'Content generation — 10 pieces/month',
      'Basic Validate dashboard',
      'Human expert access (email)',
    ],
    limits: [
      'No client management',
      'No LSI trend history',
      'No SHIELD monitoring',
      'No PDF/PowerPoint export',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For consultants managing up to 3 clients',
    usd: 99,
    inr: 8200,
    period: 'month',
    trialDays: 14,
    highlight: true,
    cta: 'Start 14-day free trial',
    badge: 'Most Popular',
    features: [
      'Up to 3 client profiles',
      'Monthly Discovery scans',
      'Full 54-archetype library',
      'Archetype evolution system',
      'Content generation — 30 pieces/month',
      'NLP compliance checking',
      'LSI trend history & forecasting',
      'Basic crisis monitoring (SHIELD)',
      'PDF & PowerPoint export',
      'Priority email support',
    ],
    limits: [],
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'For agencies delivering at scale',
    usd: 299,
    inr: 25000,
    period: 'month',
    trialDays: 14,
    highlight: false,
    cta: 'Start 14-day free trial',
    features: [
      'Up to 10 client profiles',
      'Weekly Discovery scans',
      'Unlimited content generation',
      'White-label reports (your branding)',
      'Team collaboration — 3 seats',
      '24/7 crisis monitoring & alerts',
      'Influencer DNA analyzer',
      'Priority human expert access',
      'API access',
      'Dedicated account manager',
    ],
    limits: [],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large organisations & full SRE engagements',
    usd: null,
    inr: null,
    period: null,
    trialDays: null,
    highlight: false,
    cta: 'Contact us',
    features: [
      'Everything in Agency, plus:',
      'Unlimited team seats',
      'Custom SLA guarantees',
      'Dedicated SRE methodology training',
      'On-premise deployment option',
      'Custom AI model fine-tuning',
      'Quarterly strategic review sessions',
      'Full 12-month SRE engagement support',
    ],
    limits: [],
  },
];

const FAQ = [
  {
    q: 'What is the 14-day free trial?',
    a: 'You get full access to the Individual plan features for 14 days, no credit card required. You\'ll complete a Discovery scan, see your real LSI score, and experience the full 6-module flow before deciding.',
  },
  {
    q: 'Can I switch between plans?',
    a: 'Yes. Upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades apply at your next billing cycle.',
  },
  {
    q: 'Do you offer discounts for annual billing?',
    a: 'Annual billing saves 20% across all tiers. Contact us or select annual at checkout.',
  },
  {
    q: 'I signed up as an Individual. Can I later manage clients?',
    a: 'Yes. You can change your account mode at any time in Settings. Upgrading to Professional gives you client management immediately.',
  },
  {
    q: 'What currencies do you accept?',
    a: 'We accept payments in USD and INR. The displayed prices are equivalent — you\'ll be charged in your preferred currency.',
  },
  {
    q: 'What does the Enterprise / full SRE engagement include?',
    a: 'This is a complete 12-month engagement: dedicated strategist, full discovery audit, monthly content production, quarterly validation reports, and crisis monitoring. Priced at ₹1.5–1.8 Cr / $180K–$220K for the full engagement.',
  },
];

export default function PricingPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#080C14', fontFamily: "'Syne', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        .mono { font-family: 'DM Mono', monospace; }
      `}</style>

      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} defaultTab="signup" />

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(8,12,20,0.92)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Shield style={{ width: 20, height: 20, color: '#C9A84C' }} />
            <span style={{ fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>ReputeOS</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { setShowModal(true); }} style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sign in</button>
            <button onClick={() => setShowModal(true)} style={{ fontSize: 14, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 64, paddingLeft: 24, paddingRight: 24, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(201,168,76,0.3)', backgroundColor: 'rgba(201,168,76,0.05)', borderRadius: 999, padding: '6px 16px', marginBottom: 24 }}>
          <Zap style={{ width: 12, height: 12, color: '#C9A84C' }} />
          <span className="mono" style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase' }}>14-day free trial · No credit card</span>
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 900, color: 'white', margin: '0 0 16px', lineHeight: 1.05 }}>
          Transparent pricing.<br /><span style={{ color: '#C9A84C' }}>Pay for results.</span>
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          Start free. See your real LSI score in 14 days. Upgrade when the data convinces you — and it will.
        </p>

        {/* Currency toggle hint */}
        <p className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>
          Prices shown in USD and INR · Annual billing saves 20%
        </p>
      </section>

      {/* Pricing cards */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'start' }}>
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              style={{
                border: tier.highlight ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: 28,
                backgroundColor: tier.highlight ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.015)',
                position: 'relative',
              }}
            >
              {tier.badge && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#C9A84C', color: '#080C14', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                  {tier.badge}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <p className="mono" style={{ fontSize: 10, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{tier.id}</p>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: '0 0 6px' }}>{tier.name}</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{tier.tagline}</p>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {tier.usd ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 40, fontWeight: 900, color: 'white' }}>${tier.usd}</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>/ month</span>
                    </div>
                    <p className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>₹{tier.inr?.toLocaleString()} / month</p>
                    {tier.trialDays && (
                      <p style={{ fontSize: 12, color: '#C9A84C', marginTop: 8 }}>
                        {tier.trialDays}-day free trial included
                      </p>
                    )}
                  </>
                ) : (
                  <div>
                    <span style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>Custom</span>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>₹1.5–1.8 Cr / full engagement</p>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  padding: '12px 0',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 24,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  backgroundColor: tier.highlight ? '#C9A84C' : 'transparent',
                  color: tier.highlight ? '#080C14' : '#C9A84C',
                  border: tier.highlight ? 'none' : '1px solid rgba(201,168,76,0.3)',
                }}
              >
                {tier.cta} {tier.id !== 'enterprise' && <ArrowRight style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle' }} />}
              </button>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tier.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Check style={{ width: 14, height: 14, color: '#C9A84C', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
                {tier.limits.map((l) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ width: 14, height: 14, flexShrink: 0, color: 'rgba(255,255,255,0.15)', fontSize: 14, textAlign: 'center' }}>—</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', lineHeight: 1.4 }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Human Expert note */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 32, backgroundColor: 'rgba(255,255,255,0.01)', textAlign: 'center' }}>
          <p className="mono" style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Available on all plans</p>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 12 }}>Need a Human Expert?</h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 20px' }}>
            Stuck on content, strategy, or crisis response? Every plan includes access to our network of reputation experts. One message, and a human strategist joins the conversation within 24 hours.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {[
              { label: 'Polish my draft', price: '₹1,000' },
              { label: 'Content rewrite', price: '₹2,000' },
              { label: 'Full strategy session', price: '₹5,000' },
            ].map((item) => (
              <div key={item.label} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                {item.label} <span style={{ color: '#C9A84C', fontWeight: 700 }}>{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '0 24px 100px', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 40 }}>Common questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 0' }}>
              <p style={{ fontWeight: 700, color: 'white', marginBottom: 8, fontSize: 15 }}>{item.q}</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '60px 24px 80px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', marginBottom: 16 }}>Start with your LSI score. Free.</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>14 days. No credit card. See your number before you decide.</p>
        <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '14px 28px', borderRadius: 10, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Get your free LSI score <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Shield style={{ width: 16, height: 16, color: '#C9A84C' }} />
            <span style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>ReputeOS</span>
          </Link>
          <p className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>© {new Date().getFullYear()} ReputeOS</p>
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            <Link href="/home" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
