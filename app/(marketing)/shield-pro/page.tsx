'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Shield, AlertTriangle, FileSearch, Scale, Database, ArrowRight, Check, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';

const GOLD   = '#C9A84C';
const BG     = '#050810';
const CARD   = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(201,168,76,0.12)';

const RISK_SIGNALS = [
  { icon: Scale,       label: 'Court Records & Litigation',   desc: 'Civil suits, criminal proceedings, arbitration — across High Courts, District Courts, consumer forums, and NCLT.' },
  { icon: Database,    label: 'Regulatory Filings',           desc: 'SEBI orders, RBI notices, IRDAI actions, TRAI violations — every sector regulator in India.' },
  { icon: FileSearch,  label: 'MCA & Corporate Records',      desc: 'Director disqualifications, struck-off companies, DIN status, charge satisfaction — Ministry of Corporate Affairs.' },
  { icon: AlertTriangle, label: 'Enforcement Actions',        desc: 'ED, CBI, IT department, Enforcement Directorate — any enforcement signal that could surface in due diligence.' },
  { icon: Shield,      label: 'Insolvency & Bankruptcy',      desc: 'NCLT proceedings, IBC filings, winding-up petitions, NCLAT appeals — corporate and personal insolvency.' },
  { icon: Lock,        label: 'Media Legal Signal Scan',      desc: 'News coverage of disputes, allegations, settlement reports, and legal commentary anchored to the subject.' },
];

const OUTCOMES = [
  { stat: '6hrs', label: 'Average legal scan time', sub: 'vs 3-4 weeks for traditional due diligence' },
  { stat: '23+', label: 'Indian legal databases searched', sub: 'eCourts, SEBI, MCA, NCLT, NCLAT, CCI, tribunals' },
  { stat: '94%', label: 'Legal exposure detection rate', sub: 'vs ~60% from manual research alone' },
  { stat: '₹0', label: 'Hidden per-report cost', sub: 'Included in Agency and Enterprise plans' },
];

const USE_CASES = [
  { role: 'Investment Due Diligence', desc: 'Before backing a founder or co-investing alongside a promoter — know the legal exposure before the wire transfer.' },
  { role: 'Board Appointment Screening', desc: 'Governance committees need clean legal profiles. Surface material risk before it becomes a liability.' },
  { role: 'Agency Client Onboarding', desc: 'Before taking on a reputation engagement — understand what you\'re actually working with. Avoid undisclosed legal drag.' },
  { role: 'Pre-IPO Reputation Hardening', desc: 'DRHP due diligence will surface everything. Surface it first, on your terms, with time to respond.' },
  { role: 'Media Interview Preparation', desc: 'Journalists run legal checks before major profiles. Know what they will find.' },
  { role: 'Promoter Reputation Audit', desc: 'Family office, PE-backed company, or listed entity — the promoter\'s legal profile is the company\'s reputational risk.' },
];

const FAQS = [
  { q: 'Is Shield Pro the same as a legal opinion?', a: 'No. Shield Pro is a reputation intelligence product, not legal advice. We surface public signals — court filings, regulatory orders, media coverage — that are already in the public domain. We do not provide legal interpretation, risk ratings, or compliance opinions. For legal advice, consult a lawyer.' },
  { q: 'How current is the data?', a: 'We query live APIs and search indices. eCourts data is typically 24–72 hours behind actual filing. SEBI and MCA data is pulled at the time of scan. The scan reflects what is publicly indexed at that moment, not a real-time court feed.' },
  { q: 'What if nothing is found?', a: 'A clean scan is a valuable output. It confirms that no material legal exposure is publicly indexed — which is a legitimate and important finding for due diligence and reputation contexts. We report absence as a confirmed signal, not a gap.' },
  { q: 'Can I run a Shield Pro scan on anyone?', a: 'Shield Pro is designed for use on clients you represent or subjects you have a legitimate professional relationship with — your own clients, potential investees, board nominees, or yourself. It is not a surveillance tool. Usage is subject to our Terms of Service.' },
  { q: 'Which plan includes Shield Pro?', a: 'Shield Pro is included in Agency and Enterprise plans. It is not available on Individual or Professional plans. Enterprise clients can run unlimited Shield Pro scans across all client profiles.' },
];

export default function ShieldProPage() {
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const font  = "'Plus Jakarta Sans', system-ui, sans-serif";
  const mono  = "'DM Mono', monospace";

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, color: 'white', fontFamily: font, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse-ring { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.05)} }
        @keyframes scan-line { 0%{transform:translateY(-100%);opacity:0} 50%{opacity:1} 100%{transform:translateY(400%);opacity:0} }
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fade-up 0.7s ease forwards; }
        .signal-card:hover { border-color: rgba(201,168,76,0.3) !important; background: rgba(201,168,76,0.04) !important; }
        .cta-btn:hover { background: #b8942e !important; transform: translateY(-1px); }
        .outline-btn:hover { background: rgba(201,168,76,0.08) !important; }
      `}</style>

      {showModal && <AuthModal isOpen onClose={() => setShowModal(false)} defaultTab="signup" />}

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(5,8,16,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Shield style={{ width: 20, color: GOLD }} />
            <span style={{ fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>ReputeOS</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/pricing" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', padding: '8px 14px' }}>Pricing</Link>
            <button onClick={() => setShowModal(true)} className="cta-btn" style={{ background: GOLD, color: '#050810', fontFamily: font, fontWeight: 700, fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 150ms' }}>
              Request Access
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 100, maxWidth: 1200, margin: '0 auto', padding: '140px 24px 100px', position: 'relative' }}>
        {/* Background legal grid texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Badge */}
        <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,168,76,0.08)', border: `1px solid ${BORDER}`, borderRadius: 100, padding: '6px 14px', marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, animation: 'pulse-ring 2s ease infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: GOLD, letterSpacing: '0.05em', fontFamily: mono }}>SHIELD PRO — LEGAL INTELLIGENCE</span>
        </div>

        <h1 className="fade-up" style={{ fontSize: 'clamp(36px, 5vw, 68px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24, animationDelay: '0.1s' }}>
          Know the legal exposure<br />
          <span style={{ color: GOLD }}>before it finds you.</span>
        </h1>

        <p className="fade-up" style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 580, marginBottom: 40, animationDelay: '0.2s' }}>
          ReputeOS Shield Pro scans 23+ Indian legal databases — eCourts, SEBI, MCA, NCLT, NCLAT — and surfaces litigation, regulatory actions, and enforcement signals before they surface in someone else's due diligence.
        </p>

        <div className="fade-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animationDelay: '0.3s' }}>
          <button onClick={() => setShowModal(true)} className="cta-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, background: GOLD, color: '#050810', fontFamily: font, fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 150ms' }}>
            Request Early Access <ArrowRight style={{ width: 16 }} />
          </button>
          <Link href="/pricing" className="outline-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid rgba(255,255,255,0.12)`, color: 'rgba(255,255,255,0.7)', fontSize: 15, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', transition: 'all 150ms' }}>
            View Plans
          </Link>
        </div>

        {/* Plan gate label */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock style={{ width: 13, color: 'rgba(255,255,255,0.25)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: mono }}>Available on Agency & Enterprise plans only</span>
        </div>
      </section>

      {/* Stats strip */}
      <section style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0 }}>
          {OUTCOMES.map((o, i) => (
            <div key={i} style={{ padding: '32px 28px', borderRight: i < OUTCOMES.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: GOLD, fontFamily: mono, letterSpacing: '-0.03em', lineHeight: 1 }}>{o.stat}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginTop: 6, marginBottom: 4 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: mono }}>{o.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What We Scan */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ marginBottom: 60 }}>
          <p style={{ fontSize: 11, fontFamily: mono, color: GOLD, letterSpacing: '0.1em', marginBottom: 14 }}>INTELLIGENCE COVERAGE</p>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>Six legal signal categories.<br />One unified risk picture.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {RISK_SIGNALS.map(({ icon: Icon, label, desc }, i) => (
            <div key={i} className="signal-card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '28px 28px', transition: 'all 200ms', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 18, color: GOLD }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Legal Risk Report Preview */}
      <section style={{ background: 'rgba(201,168,76,0.02)', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontFamily: mono, color: GOLD, letterSpacing: '0.1em', marginBottom: 14 }}>WHAT YOU RECEIVE</p>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 24 }}>A structured legal reputation report. Not a raw data dump.</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 32 }}>Every Shield Pro scan produces a formatted intelligence report with a Legal Risk Score (0–100), categorised findings, source citations, and strategic response guidance — exportable as PDF.</p>
            {[
              'Legal Risk Score with component breakdown',
              'Active litigation summary with case references',
              'Regulatory action log with order dates',
              'MCA director status and company health flags',
              'Media-sourced legal signal timeline',
              'Response playbooks for each risk category',
              'Clean scan certificate (if no material findings)',
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <Check style={{ width: 15, color: GOLD, flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Mock report card */}
          <div style={{ background: '#0a0f1a', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 16, padding: 32, fontFamily: mono, position: 'relative', overflow: 'hidden' }}>
            {/* Scan line animation */}
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}40, transparent)`, animation: 'scan-line 3s linear infinite', top: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Shield style={{ width: 18, color: GOLD }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: GOLD, letterSpacing: '0.05em' }}>SHIELD PRO — LEGAL INTELLIGENCE REPORT</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>LEGAL RISK SCORE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 52, fontWeight: 800, color: '#10b981', lineHeight: 1 }}>87</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>/100 — Clean</span>
              </div>
            </div>

            {[
              { label: 'eCourts / Civil Litigation', status: 'Clear', color: '#10b981' },
              { label: 'SEBI Regulatory Orders',     status: 'Clear', color: '#10b981' },
              { label: 'MCA Director Status',         status: 'Active — DIN Valid', color: '#10b981' },
              { label: 'NCLT / Insolvency',           status: '1 dismissed proceeding', color: '#f59e0b' },
              { label: 'Enforcement Actions',         status: 'Clear', color: '#10b981' },
              { label: 'Media Legal Signals',         status: '2 historical mentions', color: '#f59e0b' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: row.color }}>{row.status}</span>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: '#10b981' }}>✓ No material legal exposure detected. Clean scan certificate issued.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ marginBottom: 60 }}>
          <p style={{ fontSize: 11, fontFamily: mono, color: GOLD, letterSpacing: '0.1em', marginBottom: 14 }}>USE CASES</p>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>Who runs Shield Pro scans.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {USE_CASES.map(({ role, desc }, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '24px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 10, fontFamily: mono }}>{role}</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: 'rgba(201,168,76,0.02)', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '100px 24px' }}>
          <p style={{ fontSize: 11, fontFamily: mono, color: GOLD, letterSpacing: '0.1em', marginBottom: 14 }}>FAQ</p>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 48 }}>Common questions.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: font }}>{f.q}</span>
                  {openFaq === i ? <ChevronUp style={{ width: 16, color: GOLD, flexShrink: 0 }} /> : <ChevronDown style={{ width: 16, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />}
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75 }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontFamily: mono, color: GOLD, letterSpacing: '0.1em', marginBottom: 20 }}>GET STARTED</p>
        <h2 style={{ fontSize: 'clamp(30px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>Know before the<br />due diligence does.</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
          Shield Pro is available on Agency and Enterprise plans. Request access or upgrade your plan today.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowModal(true)} className="cta-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, background: GOLD, color: '#050810', fontFamily: font, fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 150ms' }}>
            Request Early Access <ArrowRight style={{ width: 16 }} />
          </button>
          <Link href="/pricing" className="outline-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 15, padding: '14px 32px', borderRadius: 10, textDecoration: 'none', transition: 'all 150ms' }}>
            Compare Plans
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: mono }}>
          ReputeOS Shield Pro is a reputation intelligence tool. It does not constitute legal advice. Always consult a qualified legal professional for legal matters.
        </p>
      </footer>
    </div>
  );
}
