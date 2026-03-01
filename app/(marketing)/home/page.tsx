'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Shield, Search, BarChart2, Target, PenLine, CheckSquare, ArrowRight, TrendingUp, Star, ChevronRight } from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';

// SEO note: metadata must be in a separate server component or layout when using 'use client'
// The marketing layout sets robots: index, follow. Page title is set via <title> in head via next/head if needed.

const MODULES = [
  { icon: Search, label: 'DISCOVER', title: 'Audit Your Digital Footprint', desc: 'Automated scan across 50+ sources — search engines, media outlets, social platforms, regulatory filings. Know exactly how you appear online.', stat: '50+ sources' },
  { icon: BarChart2, label: 'DIAGNOSE', title: 'LSI Reputation Scoring', desc: 'Your Leadership Sentiment Index — a 6-component score (0–100) built on Six Sigma methodology. Not guesswork. Measurement.', stat: '6-component score' },
  { icon: Target, label: 'POSITION', title: 'Archetype Strategy', desc: 'Choose from 54 professional archetypes. AI predicts your followability score and generates a bespoke content strategy locked to your identity.', stat: '54 archetypes' },
  { icon: PenLine, label: 'EXPRESS', title: 'AI Content Creation', desc: 'Thought leadership content engineered for your archetype — LinkedIn, op-eds, X threads, whitepapers — with NLP compliance checking built in.', stat: 'NLP-validated' },
  { icon: CheckSquare, label: 'VALIDATE', title: 'Prove the ROI', desc: "Statistical before/after proof. T-tests, Cohen's d, frame shift analysis. Board-ready reports generated in one click.", stat: 'p < 0.05 precision' },
  { icon: Shield, label: 'SHIELD', title: 'Crisis & Competitor Intel', desc: '24/7 monitoring with real-time alerts. Sentiment drops, volume spikes, narrative drift — catch it before it becomes a crisis.', stat: '24/7 monitoring' },
];

const CASE_STUDIES = [
  { name: 'Rajiv M.', role: 'CEO, Infrastructure Conglomerate', before: 28, after: 71, duration: '90 days', result: 'Repositioned from "family legacy" to "infrastructure innovator." Led to Forbes India feature and two board invitations.' },
  { name: 'Priya S.', role: 'Managing Partner, PE Firm', before: 42, after: 84, duration: '6 months', result: 'LSI moved from Reputation Vulnerability to Strong Authority. 3 unsolicited board appointments in 6 months.' },
  { name: 'Arjun T.', role: 'Founder, Climate Tech', before: 19, after: 67, duration: '4 months', result: 'Built Expert archetype from zero. Keynote at COP29. Series B closed at 2× original valuation target.' },
];

const LSI_BANDS = [
  { range: '86–100', label: 'Elite Authority', color: '#10b981' },
  { range: '71–85', label: 'Strong Authority', color: '#3b82f6' },
  { range: '56–70', label: 'Functional Legitimacy', color: '#eab308' },
  { range: '36–55', label: 'Reputation Vulnerability', color: '#f97316' },
  { range: '0–35', label: 'Severe Impairment', color: '#ef4444' },
];

const USE_CASES = [
  { icon: '👤', title: 'The Invisible Architect', sub: 'Executives & Senior Leaders', desc: 'Deeply accomplished but digitally invisible. Your work is not speaking for itself because the internet has not heard about it yet.' },
  { icon: '⏱', title: 'The Pre-Event Sprinter', sub: 'IPO, Fundraising, Board Nomination', desc: 'You have a hard deadline. The roadshow starts. The nomination committee is looking. Reputation now has a timeline.' },
  { icon: '🛡', title: 'The Crisis Rebuilder', sub: 'Recovery & Narrative Reset', desc: 'One article. One incident. One search result. We engineer the narrative shift with Six Sigma precision, not PR spin.' },
  { icon: '📈', title: 'The Scale-Seeking Consultant', sub: 'PR & Reputation Practitioners', desc: 'You have hit capacity doing this manually. ReputeOS 10x your client throughput and gives you statistical proof of results.' },
];

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'signup' | 'login'>('signup');
  const syne = "'Plus Jakarta Sans', system-ui, sans-serif";
  const mono = "'DM Mono', monospace";

  function openSignup() { setModalTab('signup'); setShowModal(true); }
  function openLogin() { setModalTab('login'); setShowModal(true); }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080C14', color: 'white', fontFamily: syne }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');.grid-bg{background-image:linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.04) 1px,transparent 1px);background-size:60px 60px}@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}.marquee{animation:marquee 30s linear infinite}`}</style>

      {showModal && <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} defaultTab={modalTab} />}

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(8,12,20,0.92)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield style={{ width: 20, height: 20, color: '#C9A84C' }} />
            <span style={{ fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>ReputeOS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
            <a href="#how" style={{ color: 'inherit', textDecoration: 'none' }}>How it works</a>
            <a href="#results" style={{ color: 'inherit', textDecoration: 'none' }}>Results</a>
            <a href="#usecases" style={{ color: 'inherit', textDecoration: 'none' }}>Who it&apos;s for</a>
            <Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={openLogin} style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.55)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: syne }}>App</button>
            <button onClick={openSignup} style={{ fontSize: 14, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: syne }}>Get started free</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="grid-bg" style={{ paddingTop: 140, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(201,168,76,0.3)', backgroundColor: 'rgba(201,168,76,0.05)', borderRadius: 999, padding: '6px 18px', marginBottom: 36 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Strategic Reputation Engineering</span>
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: 'white', margin: 0 }}>
            Your reputation is<br /><span style={{ color: '#C9A84C' }}>quantifiable.</span><br /><span style={{ color: 'rgba(255,255,255,0.28)' }}>Most people don&apos;t know their score.</span>
          </h1>
          <p style={{ marginTop: 28, fontSize: 18, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, maxWidth: 560, margin: '28px auto 0' }}>
            ReputeOS is the world&apos;s first Strategic Reputation Engineering platform. We give your reputation a number — the LSI score — then systematically improve it. Not PR. Not branding. Engineering.
          </p>
          <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <button onClick={openSignup} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '14px 28px', borderRadius: 10, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: syne }}>Get my free LSI score <ArrowRight style={{ width: 16, height: 16 }} /></button>
            <a href="#how" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 500, padding: '14px 28px', borderRadius: 10, fontSize: 15, textDecoration: 'none' }}>See how it works</a>
          </div>
          <p style={{ fontFamily: mono, fontSize: 12, color: 'rgba(255,255,255,0.18)', marginTop: 16 }}>14-day free trial · No credit card required</p>

          {/* LSI Demo widget */}
          <div style={{ marginTop: 64, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.015)', padding: '32px 28px', maxWidth: 540, margin: '64px auto 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Leadership Sentiment Index</p>
                <p style={{ fontSize: 40, fontWeight: 900, color: 'white', margin: '4px 0 0' }}>73 <span style={{ fontSize: 18, fontWeight: 400, color: '#C9A84C' }}>/ 100</span></p>
                <p style={{ fontSize: 13, color: '#C9A84C', margin: '2px 0 0' }}>↑ Strong Authority · +44 pts in 90 days</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Baseline</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.22)', margin: '4px 0 0' }}>29</p>
              </div>
            </div>
            {[{ label: 'Search Reputation', score: 16, max: 20 }, { label: 'Media Framing', score: 14, max: 20 }, { label: 'Social Signal', score: 17, max: 20 }, { label: 'Elite Discourse', score: 12, max: 15 }, { label: 'Third-Party Validation', score: 10, max: 15 }, { label: 'Crisis Moat', score: 4, max: 10 }].map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.22)', width: 136, textAlign: 'right', flexShrink: 0 }}>{c.label}</span>
                <div style={{ flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${(c.score / c.max) * 100}%`, height: '100%', backgroundColor: '#C9A84C', borderRadius: 3 }} /></div>
                <span style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.28)', width: 36, flexShrink: 0 }}>{c.score}/{c.max}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(201,168,76,0.03)', padding: '14px 0', overflow: 'hidden' }}>
        <div className="marquee" style={{ fontFamily: mono, display: 'flex', gap: 60, whiteSpace: 'nowrap', fontSize: 11, color: 'rgba(201,168,76,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {['LSI Scoring', '54 Archetypes', 'NLP Compliance', 'Six Sigma Analysis', 'Influencer DNA', 'Crisis Shield', 'Board Reports', 'Followability Prediction', 'Frame Detection', 'Statistical Proof', 'LSI Scoring', '54 Archetypes', 'NLP Compliance', 'Six Sigma Analysis', 'Influencer DNA', 'Crisis Shield', 'Board Reports', 'Followability Prediction'].map((t, i) => <span key={i} style={{ flexShrink: 0 }}>• {t}</span>)}
        </div>
      </div>

      {/* Use Cases */}
      <section id="usecases" style={{ padding: '112px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: mono, fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Who comes to ReputeOS</p>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: 'white', margin: '0 0 48px', lineHeight: 1.1 }}>Four types of people.<br />One urgent problem.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(256px, 1fr))', gap: 16 }}>
            {USE_CASES.map(uc => (
              <div key={uc.title} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, backgroundColor: 'rgba(255,255,255,0.015)' }}>
                <div style={{ fontSize: 28, marginBottom: 16 }}>{uc.icon}</div>
                <p style={{ fontFamily: mono, fontSize: 10, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{uc.sub}</p>
                <h3 style={{ fontWeight: 700, color: 'white', marginBottom: 10, fontSize: 16 }}>{uc.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="how" style={{ padding: '112px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: mono, fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>The 6-Module System</p>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: 'white', margin: '0 0 16px', lineHeight: 1.1 }}>Discover. Diagnose. Position.<br />Express. Validate. Shield.</h2>
          <p style={{ color: 'rgba(255,255,255,0.33)', fontSize: 17, maxWidth: 520, marginBottom: 56 }}>Sequential by design. Each module feeds the next. An end-to-end reputation engineering machine — not a collection of tools.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div key={mod.label} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, backgroundColor: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.32)' }} /></div>
                      <span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <span style={{ fontFamily: mono, fontSize: 10, border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(201,168,76,0.5)', padding: '2px 8px', borderRadius: 4 }}>{mod.stat}</span>
                  </div>
                  <p style={{ fontFamily: mono, fontSize: 10, color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{mod.label}</p>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>{mod.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LSI Bands */}
      <section className="grid-bg" style={{ padding: '112px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: mono, fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>The LSI Score</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: 'white', margin: '0 0 20px', lineHeight: 1.15 }}>Finally — a number<br />that means something.</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', lineHeight: 1.75, marginBottom: 28, fontSize: 15 }}>The Leadership Sentiment Index is a 0–100 composite score across six weighted components built on Six Sigma methodology. Calculated from real data. Not a survey. Not an opinion. A measurement.</p>
            <button onClick={openSignup} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: syne, padding: 0 }}>Calculate your LSI free <ChevronRight style={{ width: 14, height: 14 }} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LSI_BANDS.map(band => (
              <div key={band.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.22)', width: 44, textAlign: 'right', flexShrink: 0 }}>{band.range}</span>
                <div style={{ flex: 1, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.015)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: band.color }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.52)', fontWeight: 500 }}>{band.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section id="results" style={{ padding: '112px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ fontFamily: mono, fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Validated Results</p>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: 'white', margin: '0 0 48px', lineHeight: 1.1 }}>Real scores. Real timelines.<br />Statistically significant.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {CASE_STUDIES.map(cs => (
              <div key={cs.name} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24, backgroundColor: 'rgba(255,255,255,0.015)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div><p style={{ fontFamily: mono, fontSize: 10, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>Before</p><p style={{ fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,0.22)', margin: '4px 0 0' }}>{cs.before}</p></div>
                  <div style={{ flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}><div style={{ width: `${cs.after}%`, height: '100%', background: 'linear-gradient(to right, rgba(255,255,255,0.12), #C9A84C)', borderRadius: 3 }} /></div>
                  <div style={{ textAlign: 'right' }}><p style={{ fontFamily: mono, fontSize: 10, color: '#C9A84C', textTransform: 'uppercase' }}>After</p><p style={{ fontSize: 36, fontWeight: 900, color: '#C9A84C', margin: '4px 0 0' }}>{cs.after}</p></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}><TrendingUp style={{ width: 15, height: 15, color: '#34d399', flexShrink: 0, marginTop: 2 }} /><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.6 }}>{cs.result}</p></div>
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontWeight: 700, color: 'white', fontSize: 13 }}>{cs.name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>{cs.role}</p>
                  <span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(201,168,76,0.48)', marginTop: 6, display: 'inline-block' }}>{cs.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontFamily: mono, fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Pricing</p>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', marginBottom: 16 }}>From $29/month. Start free.</h2>
          <p style={{ color: 'rgba(255,255,255,0.33)', fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>Individual, Professional, Agency, and Enterprise plans. All start with a 14-day free trial. No credit card until you are convinced.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', fontWeight: 600, padding: '12px 24px', borderRadius: 8, fontSize: 14, textDecoration: 'none' }}>View full pricing <ChevronRight style={{ width: 14, height: 14 }} /></Link>
            <button onClick={openSignup} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '12px 24px', borderRadius: 8, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: syne }}>Start free trial <ArrowRight style={{ width: 14, height: 14 }} /></button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Star style={{ width: 14, height: 14, color: '#C9A84C' }} /><span style={{ fontFamily: mono, fontSize: 11, color: 'rgba(201,168,76,0.52)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Your turn</span><Star style={{ width: 14, height: 14, color: '#C9A84C' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 900, color: 'white', marginBottom: 20, lineHeight: 1.05 }}>What is your LSI score?</h2>
          <p style={{ color: 'rgba(255,255,255,0.33)', fontSize: 17, marginBottom: 40, lineHeight: 1.6 }}>Most professionals have never measured their reputation. In 14 days, you will have your number, your gap analysis, and a clear path forward.</p>
          <button onClick={openSignup} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '18px 36px', borderRadius: 12, fontSize: 16, border: 'none', cursor: 'pointer', fontFamily: syne }}>Get my free LSI score <ArrowRight style={{ width: 18, height: 18 }} /></button>
          <p style={{ fontFamily: mono, color: 'rgba(255,255,255,0.14)', fontSize: 12, marginTop: 20 }}>Free 14-day trial · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield style={{ width: 16, height: 16, color: '#C9A84C' }} /><span style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>ReputeOS</span></div>
          <p style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.14)' }}>© {new Date().getFullYear()} ReputeOS. Strategic Reputation Engineering.</p>
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'rgba(255,255,255,0.22)', flexWrap: 'wrap' }}>
            <Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link>
            <button onClick={openLogin} style={{ color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: syne }}>Sign in</button>
            <button onClick={openSignup} style={{ color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: syne }}>Get started</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
