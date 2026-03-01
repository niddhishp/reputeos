// app/(marketing)/home/page.tsx
import Link from 'next/link';
import {
  Shield, Search, BarChart2, Target, PenLine, CheckSquare,
  ArrowRight, TrendingUp, Star, ChevronRight,
} from 'lucide-react';

export const metadata = {
  title: 'ReputeOS — Strategic Reputation Engineering',
  description: "The world's first AI-powered Strategic Reputation Engineering platform. Build, measure, and protect your professional reputation with scientific precision.",
};

const MODULES = [
  {
    icon: Search,
    label: 'DISCOVER',
    title: 'Audit Your Digital Footprint',
    desc: 'Automated scan across 50+ sources — search engines, media outlets, social platforms, regulatory filings. Know exactly how you appear online.',
    stat: '50+ sources',
  },
  {
    icon: BarChart2,
    label: 'DIAGNOSE',
    title: 'LSI Reputation Scoring',
    desc: 'Your Leadership Sentiment Index — a rigorous 6-component score (0–100) built on Six Sigma methodology. Not vibes. Data.',
    stat: '6-component score',
  },
  {
    icon: Target,
    label: 'POSITION',
    title: 'Archetype Strategy',
    desc: 'Choose from 54 professional archetypes. AI predicts your followability score and generates a bespoke content strategy locked to your identity.',
    stat: '54 archetypes',
  },
  {
    icon: PenLine,
    label: 'EXPRESS',
    title: 'AI Content Creation',
    desc: 'Thought leadership content engineered for your archetype — LinkedIn, op-eds, X threads, whitepapers — with NLP compliance checking built in.',
    stat: 'NLP-validated',
  },
  {
    icon: CheckSquare,
    label: 'VALIDATE',
    title: 'Prove the ROI',
    desc: "Statistical before/after proof. T-tests, Cohen's d, frame shift analysis. Board-ready PDF and PowerPoint reports generated in one click.",
    stat: 'p < 0.05 precision',
  },
  {
    icon: Shield,
    label: 'SHIELD',
    title: 'Crisis & Competitor Intel',
    desc: '24/7 monitoring with real-time alerts. Sentiment drops, volume spikes, narrative drift — catch it before it becomes a crisis.',
    stat: '24/7 monitoring',
  },
];

const CASE_STUDIES = [
  {
    name: 'Rajiv M.',
    role: 'CEO, Infrastructure Conglomerate',
    before: 28,
    after: 71,
    duration: '90 days',
    result: 'Repositioned from "family legacy" framing to "infrastructure innovator" — led to Forbes India feature.',
  },
  {
    name: 'Priya S.',
    role: 'Managing Partner, PE Firm',
    before: 42,
    after: 84,
    duration: '6 months',
    result: 'LSI went from Reputation Vulnerability to Strong Authority. 3 unsolicited board invitations.',
  },
  {
    name: 'Arjun T.',
    role: 'Founder, Climate Tech',
    before: 19,
    after: 67,
    duration: '4 months',
    result: 'Built Expert archetype from scratch. Keynote at COP29. Series B closed at 2× valuation.',
  },
];

const LSI_BANDS = [
  { range: '86–100', label: 'Elite Authority',          color: 'bg-emerald-500' },
  { range: '71–85',  label: 'Strong Authority',         color: 'bg-blue-500' },
  { range: '56–70',  label: 'Functional Legitimacy',    color: 'bg-yellow-500' },
  { range: '36–55',  label: 'Reputation Vulnerability', color: 'bg-orange-500' },
  { range: '0–35',   label: 'Severe Impairment',        color: 'bg-red-500' },
];

const USE_CASES = [
  { icon: '👤', title: 'Executives & CEOs',       desc: 'Control your narrative. Shape how analysts, media, and talent see you.' },
  { icon: '🏢', title: 'Reputation Consultants',  desc: 'Manage multiple clients with scientific rigor. Generate board-ready proof.' },
  { icon: '🚀', title: 'Founders',                desc: 'Build authority that attracts investors, press, and top-tier hires.' },
  { icon: '⚖️', title: 'Professionals in Crisis', desc: 'Structured crisis response. Rapid narrative correction. Documented recovery.' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#080C14', fontFamily: "'Syne', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        .mono { font-family: 'DM Mono', monospace; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee { animation: marquee 30s linear infinite; }
        @keyframes fade-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fade-up 0.7s ease both; }
        .d1 { animation-delay: 0.1s; }
        .d2 { animation-delay: 0.2s; }
        .d3 { animation-delay: 0.3s; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(8,12,20,0.92)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield style={{ width: 20, height: 20, color: '#C9A84C' }} />
            <span style={{ fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>ReputeOS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ fontSize: 14, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="grid-bg" style={{ paddingTop: 128, paddingBottom: 96, paddingLeft: 24, paddingRight: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '33%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)' }} />
        </div>
        <div className="fade-up" style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(201,168,76,0.3)', backgroundColor: 'rgba(201,168,76,0.05)', borderRadius: 999, padding: '6px 16px', marginBottom: 32 }}>
            <span className="mono" style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase' }}>The Science of Reputation</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: 'white', margin: 0 }}>
            Your reputation is<br />
            <span style={{ color: '#C9A84C' }}>quantifiable.</span><br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>Most people don&apos;t know it.</span>
          </h1>

          <p className="d1 fade-up" style={{ marginTop: 28, fontSize: 18, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 580, margin: '28px auto 0' }}>
            ReputeOS is the world&apos;s first Strategic Reputation Engineering platform.
            We audit, score, position, and protect professional reputations with scientific precision — not guesswork.
          </p>

          <div className="d2 fade-up" style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '14px 28px', borderRadius: 10, fontSize: 15, textDecoration: 'none' }}>
              Start building your reputation <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <a href="#how" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 500, padding: '14px 28px', borderRadius: 10, fontSize: 15, textDecoration: 'none' }}>
              See how it works
            </a>
          </div>

          {/* LSI Demo Card */}
          <div className="d3 fade-up" style={{ marginTop: 64, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.015)', padding: 32, maxWidth: 560, margin: '64px auto 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ textAlign: 'left' }}>
                <p className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Leadership Sentiment Index</p>
                <p style={{ fontSize: 40, fontWeight: 900, color: 'white', margin: '4px 0 0' }}>73 <span style={{ fontSize: 18, fontWeight: 400, color: '#C9A84C' }}>/ 100</span></p>
                <p style={{ fontSize: 13, color: '#C9A84C', margin: '2px 0 0' }}>Strong Authority ↑</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Baseline</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.25)', margin: '4px 0 0' }}>29</p>
              </div>
            </div>
            {[
              { label: 'Search Reputation', score: 16, max: 20 },
              { label: 'Media Framing',     score: 14, max: 20 },
              { label: 'Social Signal',     score: 17, max: 20 },
              { label: 'Elite Discourse',   score: 12, max: 15 },
              { label: 'Validation',        score: 10, max: 15 },
              { label: 'Crisis Moat',       score: 4,  max: 10 },
            ].map((c) => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', width: 120, textAlign: 'right', flexShrink: 0 }}>{c.label}</span>
                <div style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(c.score / c.max) * 100}%`, height: '100%', backgroundColor: '#C9A84C', borderRadius: 3 }} />
                </div>
                <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', width: 36, flexShrink: 0 }}>{c.score}/{c.max}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(201,168,76,0.04)', padding: '14px 0', overflow: 'hidden' }}>
        <div className="marquee mono" style={{ display: 'flex', gap: 64, whiteSpace: 'nowrap', fontSize: 11, color: 'rgba(201,168,76,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {['LSI Scoring','54 Archetypes','NLP Compliance','Six Sigma Analysis','Influencer DNA','Crisis Shield','Board Reports','Followability Prediction','Frame Detection','Sentiment Mapping',
            'LSI Scoring','54 Archetypes','NLP Compliance','Six Sigma Analysis','Influencer DNA','Crisis Shield','Board Reports','Followability Prediction'].map((t, i) => (
            <span key={i} style={{ flexShrink: 0 }}>• {t}</span>
          ))}
        </div>
      </div>

      {/* Modules */}
      <section id="how" style={{ padding: '112px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <p className="mono" style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>The Platform</p>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1 }}>
              Six modules.<br />One complete system.
            </h2>
            <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.35)', fontSize: 17, maxWidth: 480 }}>
              Sequential by design. Each module feeds the next. Together they form an end-to-end reputation engineering machine.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div key={mod.label} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, backgroundColor: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.35)' }} />
                      </div>
                      <span className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <span className="mono" style={{ fontSize: 10, border: '1px solid rgba(201,168,76,0.2)', color: 'rgba(201,168,76,0.55)', padding: '2px 8px', borderRadius: 4 }}>{mod.stat}</span>
                  </div>
                  <p className="mono" style={{ fontSize: 10, color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{mod.label}</p>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>{mod.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.37)', lineHeight: 1.6 }}>{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LSI Bands */}
      <section id="lsi" className="grid-bg" style={{ padding: '112px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div>
            <p className="mono" style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>The LSI Score</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: 'white', margin: '0 0 20px', lineHeight: 1.15 }}>Finally — a number that means something.</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, marginBottom: 28, fontSize: 15 }}>
              The Leadership Sentiment Index is a composite 0–100 score across six weighted components: Search Reputation, Media Framing, Social Signal, Elite Discourse, Third-Party Validation, and Crisis Moat. Calculated with Six Sigma statistical methodology. Not an opinion. A measurement.
            </p>
            <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#C9A84C', textDecoration: 'none' }}>
              Calculate your LSI <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LSI_BANDS.map((band) => (
              <div key={band.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', width: 44, textAlign: 'right', flexShrink: 0 }}>{band.range}</span>
                <div style={{ flex: 1, height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.015)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
                  <div className={band.color} style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{band.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section id="results" style={{ padding: '112px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <p className="mono" style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Results</p>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1 }}>
              What a 44-point LSI<br />improvement looks like.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {CASE_STUDIES.map((cs) => (
              <div key={cs.name} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 24, backgroundColor: 'rgba(255,255,255,0.015)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Before</p>
                    <p style={{ fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,0.25)', margin: '4px 0 0' }}>{cs.before}</p>
                  </div>
                  <div style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${cs.after}%`, height: '100%', background: 'linear-gradient(to right, rgba(255,255,255,0.15), #C9A84C)', borderRadius: 3 }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="mono" style={{ fontSize: 10, color: '#C9A84C', textTransform: 'uppercase' }}>After</p>
                    <p style={{ fontSize: 36, fontWeight: 900, color: '#C9A84C', margin: '4px 0 0' }}>{cs.after}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <TrendingUp style={{ width: 15, height: 15, color: '#34d399', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{cs.result}</p>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontWeight: 700, color: 'white', fontSize: 13 }}>{cs.name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{cs.role}</p>
                  <span className="mono" style={{ fontSize: 11, color: 'rgba(201,168,76,0.5)', marginTop: 6, display: 'inline-block' }}>{cs.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="usecases" style={{ padding: '112px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <p className="mono" style={{ fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Who it&apos;s for</p>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1 }}>
              Reputation is a career asset.<br />We help you manage it like one.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {USE_CASES.map((uc) => (
              <div key={uc.title} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, backgroundColor: 'rgba(255,255,255,0.015)' }}>
                <div style={{ fontSize: 28, marginBottom: 16 }}>{uc.icon}</div>
                <h3 style={{ fontWeight: 700, color: 'white', marginBottom: 8, fontSize: 15 }}>{uc.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(201,168,76,0.1) 0%, transparent 70%)' }} />
        </div>
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Star style={{ width: 14, height: 14, color: '#C9A84C' }} />
            <span className="mono" style={{ fontSize: 11, color: 'rgba(201,168,76,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Start today</span>
            <Star style={{ width: 14, height: 14, color: '#C9A84C' }} />
          </div>
          <h2 style={{ fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 900, color: 'white', marginBottom: 20, lineHeight: 1.05 }}>
            What is your LSI score?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 17, marginBottom: 40, lineHeight: 1.6 }}>
            Most professionals have never measured their reputation.<br />You&apos;re about to be different.
          </p>
          <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '18px 36px', borderRadius: 12, fontSize: 16, textDecoration: 'none' }}>
            Calculate your LSI score <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
          <p className="mono" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, marginTop: 20 }}>
            Free to start — no credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield style={{ width: 16, height: 16, color: '#C9A84C' }} />
            <span style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>ReputeOS</span>
          </div>
          <p className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
            © {new Date().getFullYear()} ReputeOS. Strategic Reputation Engineering.
          </p>
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
