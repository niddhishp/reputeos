'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Building2, Crown, Shield, BookOpen, CreditCard, Star } from 'lucide-react';

const GOLD   = '#C9A84C';
const BG     = '#080C14';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';
const font   = "'Plus Jakarta Sans', system-ui, sans-serif";

const PLANS = [
  {
    id: 'solo', name: 'Solo', price: 4999, icon: Zap,
    description: 'For independent consultants',
    badge: null,
    features: ['3 client profiles', '30 discovery scans/month', 'LSI scoring & tracking', 'AI content generation', '5 modules (no Shield)', 'PDF/PPTX exports'],
    cta: 'Start Solo',
  },
  {
    id: 'agency', name: 'Agency', price: 14999, icon: Building2,
    description: 'For PR agencies & consultancies',
    badge: 'Most Popular',
    features: ['20 client profiles', '200 discovery scans/month', 'All 6 modules incl. Shield', 'Shield Pro — Legal Intelligence', 'Priority AI processing', 'White-label reports', 'Team access (3 seats)'],
    cta: 'Start Agency',
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 39999, icon: Crown,
    description: 'For large agencies & in-house teams',
    badge: 'Full Power',
    features: ['Unlimited client profiles', 'Unlimited scans', 'All modules + Shield Pro', 'Dedicated account manager', 'Custom API integrations', 'SLA guarantee', 'Unlimited team seats'],
    cta: 'Contact Sales',
  },
];

const ADD_ONS = [
  { id: 'discover_only', icon: BookOpen, name: 'Discover Module Only', price: 1999, type: 'recurring', desc: 'Just the digital footprint scan. Perfect if you only need reputation data for 1 client.' },
  { id: 'shield_pro', icon: Shield, name: 'Shield Pro Add-on', price: 7999, type: 'recurring', desc: 'Legal risk intelligence — eCourts, SEBI, MCA, enforcement searches. Add to any plan.' },
  { id: 'scan_credits_20', icon: CreditCard, name: '20 Scan Credits', price: 999, type: 'one_time', desc: '20 discovery scans that never expire. Top up whenever you need more.' },
  { id: 'scan_credits_100', icon: Star, name: '100 Scan Credits', price: 3999, type: 'one_time', desc: 'Best value. 100 scans that never expire — ₹40 per scan.' },
];

function PlanCard({ plan, loading, onBuy }: {
  plan: typeof PLANS[0];
  loading: string | null;
  onBuy: (type: 'plan', id: string) => void;
}) {
  const Icon = plan.icon;
  const isPopular = plan.badge === 'Most Popular';
  const isEnterprise = plan.id === 'enterprise';
  return (
    <div style={{
      background: isPopular ? 'linear-gradient(160deg,#0f1a0a 0%,#0d1117 100%)' : CARD,
      border: `1px solid ${isPopular ? GOLD : BORDER}`,
      borderRadius: 16, padding: '32px 28px', position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 24,
      boxShadow: isPopular ? `0 0 40px rgba(201,168,76,0.08)` : 'none',
    }}>
      {plan.badge && (
        <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
          background: GOLD, color: '#000', fontSize: 11, fontWeight: 700, padding: '4px 14px',
          borderRadius: 20, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          {plan.badge}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(201,168,76,0.1)',
          border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 18, color: GOLD }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{plan.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{plan.description}</div>
        </div>
      </div>

      <div>
        <span style={{ fontSize: 36, fontWeight: 800, color: 'white' }}>
          ₹{plan.price.toLocaleString('en-IN')}
        </span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>/month</span>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            <Check style={{ width: 14, color: GOLD, flexShrink: 0, marginTop: 2 }} />{f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => isEnterprise ? window.open('mailto:hello@reputeos.com?subject=Enterprise Enquiry') : onBuy('plan', plan.id)}
        disabled={loading === plan.id}
        style={{
          width: '100%', padding: '13px', borderRadius: 10, cursor: loading === plan.id ? 'wait' : 'pointer',
          background: isPopular ? GOLD : 'rgba(255,255,255,0.06)',
          color: isPopular ? '#000' : 'rgba(255,255,255,0.8)',
          border: `1px solid ${isPopular ? GOLD : 'rgba(255,255,255,0.1)'}`,
          fontSize: 14, fontWeight: 700, fontFamily: font, transition: 'all 150ms',
          opacity: loading === plan.id ? 0.6 : 1,
        }}>
        {loading === plan.id ? 'Redirecting…' : plan.cta}
      </button>
    </div>
  );
}

function AddOnCard({ addon, loading, onBuy }: {
  addon: typeof ADD_ONS[0];
  loading: string | null;
  onBuy: (type: 'addon', id: string) => void;
}) {
  const Icon = addon.icon;
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12,
      padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(201,168,76,0.08)',
        border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 15, color: GOLD }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{addon.name}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 20 }}>
            {addon.type === 'one_time' ? 'One-time' : '/month'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{addon.desc}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>
          ₹{addon.price.toLocaleString('en-IN')}
        </div>
        <button
          onClick={() => onBuy('addon', addon.id)}
          disabled={loading === addon.id}
          style={{ marginTop: 6, padding: '6px 14px', borderRadius: 7, cursor: loading === addon.id ? 'wait' : 'pointer',
            background: 'rgba(201,168,76,0.1)', color: GOLD, border: `1px solid ${BORDER}`,
            fontSize: 12, fontWeight: 600, fontFamily: font, opacity: loading === addon.id ? 0.5 : 1 }}>
          {loading === addon.id ? '…' : 'Add'}
        </button>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleBuy(type: 'plan' | 'addon', id: string) {
    setLoading(id);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.error === 'Unauthorized') { router.push('/login?from=/pricing'); return; }
      if (data.error) { setError(data.error); return; }
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: font, paddingBottom: 80 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}`}</style>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 24px 56px' }}>
        <div style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 20,
          background: 'rgba(201,168,76,0.08)', border: `1px solid ${BORDER}`,
          fontSize: 12, color: GOLD, fontWeight: 600, letterSpacing: '0.06em', marginBottom: 20 }}>
          PRICING
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, color: 'white', margin: '0 0 16px', lineHeight: 1.15 }}>
          Reputation Engineering,<br />
          <span style={{ color: GOLD }}>Priced for India</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto' }}>
          Start free for 14 days. No credit card required. Cancel anytime.
        </p>
      </div>

      {error && (
        <div style={{ maxWidth: 400, margin: '0 auto 24px', padding: '12px 20px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, color: '#ef4444', fontSize: 13, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Plans */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} loading={loading} onBuy={handleBuy} />
          ))}
        </div>

        {/* Module-only section */}
        <div style={{ marginTop: 64 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
              Need just one module?
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Add individual modules or top up scan credits without a full subscription.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ADD_ONS.map(addon => (
              <AddOnCard key={addon.id} addon={addon} loading={loading} onBuy={handleBuy} />
            ))}
          </div>
        </div>

        {/* FAQ strip */}
        <div style={{ marginTop: 64, padding: '32px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: '0 0 24px' }}>Common questions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            {[
              ['Can I switch plans?', 'Yes. Upgrade or downgrade anytime from Settings → Billing. Changes take effect immediately.'],
              ['What counts as a scan?', 'One Discovery scan for one client. Scans reset monthly on your billing date. Purchased credits never expire.'],
              ['Is there a free trial?', 'Yes — 14 days on the Solo plan, no credit card needed. Full access to all Solo features.'],
              ['What currency do you charge in?', 'All prices are in INR (₹). We use Stripe for secure payment processing.'],
            ].map(([q, a]) => (
              <div key={q}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 6 }}>{q}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
