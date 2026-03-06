'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Sparkles, RefreshCw, AlertTriangle, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Copy, Check, Users, Zap, Eye,
  BarChart3, BookOpen, Target, Flame, Star, AlertCircle, CheckCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD   = '#C9A84C';
const BG     = '#080C14';
const CARD   = '#0D1117';
const CARD2  = '#111827';
const BORDER = 'rgba(201,168,76,0.15)';
const MUTED  = 'rgba(255,255,255,0.38)';
const TEXT   = 'rgba(255,255,255,0.75)';
const GREEN  = '#4ade80';
const RED    = '#ef4444';
const AMBER  = '#f59e0b';

const ARCH: Record<string, { color: string; glow: string; symbol: string; tagline: string; essence: string; element: string }> = {
  sage:      { color:'#818cf8', glow:'#818cf8', symbol:'◈', tagline:'The Keeper of Wisdom',        essence:'Truth through insight',       element:'Ether'  },
  hero:      { color:'#f59e0b', glow:'#f59e0b', symbol:'⬡', tagline:'The Courageous Champion',     essence:'Courage through adversity',   element:'Fire'   },
  explorer:  { color:'#34d399', glow:'#34d399', symbol:'◎', tagline:'The Fearless Trailblazer',    essence:'Freedom through discovery',   element:'Wind'   },
  rebel:     { color:'#f43f5e', glow:'#f43f5e', symbol:'⊗', tagline:'The Revolutionary Disruptor', essence:'Change through defiance',     element:'Storm'  },
  magician:  { color:'#a78bfa', glow:'#a78bfa', symbol:'✦', tagline:'The Transformative Visionary',essence:'Power through transformation', element:'Arcane' },
  caregiver: { color:'#fb7185', glow:'#fb7185', symbol:'♡', tagline:'The Empowering Protector',    essence:'Strength through service',    element:'Water'  },
  creator:   { color:'#60a5fa', glow:'#60a5fa', symbol:'◇', tagline:'The Imaginative Innovator',   essence:'Impact through creation',     element:'Earth'  },
  ruler:     { color:'#fbbf24', glow:'#fbbf24', symbol:'♛', tagline:'The Commanding Authority',    essence:'Order through leadership',    element:'Gold'   },
  jester:    { color:'#f472b6', glow:'#f472b6', symbol:'◈', tagline:'The Disarming Entertainer',   essence:'Joy through authenticity',    element:'Air'    },
  lover:     { color:'#f9a8d4', glow:'#f9a8d4', symbol:'◆', tagline:'The Passionate Connector',    essence:'Connection through passion',  element:'Rose'   },
  everyman:  { color:'#6ee7b7', glow:'#6ee7b7', symbol:'○', tagline:'The Relatable Unifier',       essence:'Trust through belonging',     element:'Clay'   },
  innocent:  { color:'#fde68a', glow:'#fde68a', symbol:'✿', tagline:'The Optimistic Pioneer',      essence:'Happiness through purity',    element:'Light'  },
  default:   { color: GOLD,     glow: GOLD,     symbol:'◉', tagline:'The Strategic Leader',        essence:'Impact through vision',       element:'Spirit' },
};

function getArch(name: string) {
  const k = (name ?? '').toLowerCase().replace(/^the\s+/i,'').trim().split(/\s+/)[0];
  return ARCH[k] ?? ARCH.default;
}

// ── Geometric glyph rendered in pure SVG ──────────────────────────────────────
function ArchetypeGlyph({ name, size = 120 }: { name: string; size?: number }) {
  const a = getArch(name);
  const c = size / 2;
  const r1 = size * 0.38, r2 = size * 0.28, r3 = size * 0.16;
  const poly = (sides: number, radius: number, offset = 0) =>
    Array.from({ length: sides }, (_, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + offset;
      return `${c + radius * Math.cos(angle)},${c + radius * Math.sin(angle)}`;
    }).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow:'visible' }}>
      <defs>
        <radialGradient id={`g-${name}-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={a.color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={a.color} stopOpacity="0"   />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={size*0.48} fill={`url(#g-${name}-${size})`} />
      <circle cx={c} cy={c} r={r1} fill="none" stroke={a.color} strokeWidth="0.7" strokeOpacity="0.3"
        strokeDasharray="3 7" />
      <polygon points={poly(6, r1*0.90)} fill="none" stroke={a.color} strokeWidth="1.5" strokeOpacity="0.55" />
      <polygon points={poly(6, r2, Math.PI/6)} fill={a.color} fillOpacity="0.06"
        stroke={a.color} strokeWidth="1" strokeOpacity="0.3" />
      <circle cx={c} cy={c} r={r3} fill={a.color} fillOpacity="0.12"
        stroke={a.color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx={c} cy={c} r={size*0.035} fill={a.color} />
      {[0,60,120].map(deg => {
        const rad = deg * Math.PI / 180;
        return <line key={deg}
          x1={c - r1*Math.cos(rad)} y1={c - r1*Math.sin(rad)}
          x2={c + r1*Math.cos(rad)} y2={c + r1*Math.sin(rad)}
          stroke={a.color} strokeWidth="0.4" strokeOpacity="0.18" />;
      })}
    </svg>
  );
}

// ── Pre-reveal gate ───────────────────────────────────────────────────────────
function PreRevealGate({ clientName, onReveal, loading }: {
  clientName: string; onReveal: () => void; loading: boolean;
}) {
  return (
    <div style={{ minHeight:'75vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', maxWidth:580 }}>
        <div style={{ display:'inline-block', marginBottom:36, animation:'float 4s ease-in-out infinite' }}>
          <ArchetypeGlyph name="default" size={150} />
        </div>
        <p style={{ fontSize:10, color:GOLD, textTransform:'uppercase', letterSpacing:'0.2em', fontWeight:700, margin:'0 0 18px' }}>
          Strategic Archetype Assignment
        </p>
        <h1 style={{ fontSize:38, fontWeight:900, color:'white', margin:'0 0 16px', lineHeight:1.1, letterSpacing:'-0.02em' }}>
          Who Are You,<br /><span style={{ color:GOLD }}>{clientName || 'Executive'}?</span>
        </h1>
        <p style={{ fontSize:15, color:MUTED, lineHeight:1.7, maxWidth:440, margin:'0 auto 40px' }}>
          Our AI reads your complete digital footprint and reveals your archetype — with the peers who define it,
          the Jungian shadows to avoid, and the exact content strategy to own it.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:40, textAlign:'left' }}>
          {[
            { icon: Target,   label:'5 Reasons Why',        desc:'Evidence from your scan'    },
            { icon: Users,    label:'Named Global Leaders', desc:'Who else plays this role'   },
            { icon: BarChart3, label:'Peer LSI Comparison', desc:'Your gap vs competitors'    },
          ].map(({ icon: I, label, desc }) => (
            <div key={label} style={{ padding:'16px', background:CARD, border:`1px solid ${BORDER}`, borderRadius:12 }}>
              <I size={15} color={GOLD} style={{ marginBottom:8 }} />
              <p style={{ fontSize:12, fontWeight:700, color:'white', margin:'0 0 3px' }}>{label}</p>
              <p style={{ fontSize:11, color:MUTED, margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>
        <button onClick={onReveal} disabled={loading} style={{
          padding:'18px 48px', background:GOLD, color:'#080C14',
          fontWeight:900, fontSize:16, borderRadius:14, border:'none',
          cursor:loading ? 'not-allowed' : 'pointer', opacity:loading ? 0.7 : 1,
          display:'inline-flex', alignItems:'center', gap:10,
        }}>
          <Sparkles size={18} />
          {loading ? 'Analysing…' : 'Reveal My Archetype'}
        </button>
      </div>
    </div>
  );
}

// ── Analysing overlay ─────────────────────────────────────────────────────────
function AnalysingOverlay({ clientName }: { clientName: string }) {
  const stages = [
    'Reading your digital footprint…','Identifying behavioural patterns…',
    'Matching archetype signals…','Profiling peer executives…',
    'Calibrating followability score…','Building your reveal…',
  ];
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage(s => (s+1) % stages.length), 2400);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ minHeight:'75vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:28 }}>
      <div style={{ animation:'spinSlow 4s linear infinite' }}>
        <ArchetypeGlyph name="default" size={130} />
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:18, fontWeight:700, color:'white', margin:'0 0 8px' }}>Analysing {clientName}</p>
        <p style={{ fontSize:13, color:GOLD, margin:0, minHeight:20 }}>{stages[stage]}</p>
      </div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', maxWidth:480 }}>
        {['Behavioural Fit','Market Uniqueness','Peer Benchmarking','Followability','Content Strategy'].map((s,i) => (
          <span key={i} style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600,
            background:`${GOLD}10`, border:`1px solid ${GOLD}25`, color:`${GOLD}90` }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// ── Hero reveal ───────────────────────────────────────────────────────────────
function ArchetypeHero({ pos, lsi }: { pos: Record<string,unknown>; lsi: number }) {
  const name  = (pos.personal_archetype as string) ?? 'The Sage';
  const biz   = pos.business_archetype as string | null;
  const conf  = (pos.archetype_confidence as number) ?? 75;
  const foll  = (pos.followability_score as number) ?? 70;
  const stmt  = pos.positioning_statement as string ?? '';
  const a     = getArch(name);
  const reveal = (pos.archetype_reveal ?? {}) as Record<string,unknown>;
  const peerAvg = (reveal.peer_average_lsi as number) ?? 0;
  const gap   = peerAvg > 0 ? peerAvg - lsi : 0;
  const lsiC  = (s: number) => s >= 70 ? GREEN : s >= 50 ? GOLD : '#fb923c';

  return (
    <div style={{
      position:'relative', overflow:'hidden', borderRadius:24, marginBottom:24,
      background:`linear-gradient(135deg, ${BG} 0%, #0a0f1c 60%, ${BG} 100%)`,
      border:`1px solid ${a.color}35`,
      boxShadow:`0 0 100px ${a.glow}12, inset 0 0 60px ${a.glow}05`,
    }}>
      <div style={{ position:'absolute', top:0, right:0, width:'50%', height:'100%',
        background:`radial-gradient(ellipse 80% 100% at 90% 50%, ${a.glow}10 0%, transparent 70%)`,
        pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0,
        backgroundImage:`linear-gradient(${a.color}05 1px, transparent 1px), linear-gradient(90deg, ${a.color}05 1px, transparent 1px)`,
        backgroundSize:'48px 48px', pointerEvents:'none', opacity:0.5 }} />

      <div style={{ position:'relative', padding:'52px 48px', display:'grid', gridTemplateColumns:'1fr 300px', gap:40, alignItems:'center' }}>
        <div>
          <p style={{ fontSize:10, color:a.color, textTransform:'uppercase', letterSpacing:'0.2em', fontWeight:700, margin:'0 0 20px' }}>
            Your Strategic Identity
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:8 }}>
            <ArchetypeGlyph name={name} size={68} />
            <div>
              <p style={{ fontSize:11, color:MUTED, margin:'0 0 2px' }}>{a.element} · {a.tagline}</p>
              <h1 style={{ fontSize:'clamp(30px,4vw,50px)', fontWeight:900, color:'white', margin:0, lineHeight:1,
                letterSpacing:'-0.025em', textShadow:`0 0 60px ${a.glow}40` }}>{name}</h1>
            </div>
          </div>
          <p style={{ fontSize:13, color:a.color, fontStyle:'italic', margin:'0 0 20px', paddingLeft:88 }}>
            &ldquo;{a.essence}&rdquo;
          </p>
          {stmt && (
            <p style={{ fontSize:14, color:TEXT, lineHeight:1.7, margin:'0 0 20px',
              padding:'16px 20px', background:`${a.color}08`, borderRadius:12, border:`1px solid ${a.color}20` }}>
              {stmt}
            </p>
          )}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {biz && <span style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
              background:`${GOLD}12`, border:`1px solid ${GOLD}30`, color:GOLD }}>{biz}</span>}
            <span style={{ padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
              background:`${a.color}12`, border:`1px solid ${a.color}30`, color:a.color }}>{a.element} Element</span>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:4 }}>
            <ArchetypeGlyph name={name} size={110} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { v:`${conf}%`, label:'Confidence', color:a.color },
              { v:`${foll}%`, label:'Followability', color:foll>=70?GREEN:foll>=55?GOLD:'#fb923c' },
            ].map(({ v, label, color }) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${color}20`,
                borderRadius:12, padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:900, color, lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:10, color:MUTED, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:4 }}>{label}</div>
              </div>
            ))}
          </div>
          {lsi > 0 && (
            <div style={{ background:`${lsiC(lsi)}10`, border:`1px solid ${lsiC(lsi)}25`,
              borderRadius:14, padding:'16px 20px', textAlign:'center' }}>
              <div style={{ fontSize:36, fontWeight:900, color:lsiC(lsi), lineHeight:1 }}>{lsi}</div>
              <div style={{ fontSize:10, color:MUTED, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>Your LSI Score</div>
              {gap > 0 && (
                <div style={{ marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <TrendingDown size={12} color="#fb923c" />
                  <span style={{ fontSize:11, fontWeight:700, color:'#fb923c' }}>{gap} pts below peer avg ({peerAvg})</span>
                </div>
              )}
              {gap < 0 && (
                <div style={{ marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <TrendingUp size={12} color={GREEN} />
                  <span style={{ fontSize:11, fontWeight:700, color:GREEN }}>{Math.abs(gap)} pts above peer avg</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Why this archetype ────────────────────────────────────────────────────────
function WhyThisArchetype({ reveal, archName }: { reveal: Record<string,unknown>; archName: string }) {
  const reasons = (reveal.why_this_archetype as Array<{ reason: string; evidence: string }>) ?? [];
  const a = getArch(archName);
  if (!reasons.length) return null;
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:'36px 40px', marginBottom:20 }}>
      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:10, color:a.color, textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:700, margin:'0 0 6px' }}>Data-Backed Assignment</p>
        <h2 style={{ fontSize:22, fontWeight:900, color:'white', margin:'0 0 6px' }}>Why You Are {archName}</h2>
        <p style={{ fontSize:13, color:MUTED, margin:0 }}>5 signals from your 62-source digital scan that confirm this identity</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {reasons.map((r, i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'48px 1fr',
            background: i===0 ? `${a.color}08` : CARD2,
            border:`1px solid ${i===0 ? `${a.color}30` : 'rgba(255,255,255,0.06)'}`,
            borderRadius:14, overflow:'hidden',
          }}>
            <div style={{ background:`${a.color}12`, display:'flex', alignItems:'center', justifyContent:'center',
              borderRight:`1px solid ${a.color}20` }}>
              <span style={{ fontSize:16, fontWeight:900, color:a.color }}>0{i+1}</span>
            </div>
            <div style={{ padding:'16px 20px' }}>
              <p style={{ fontSize:14, fontWeight:700, color:'white', margin:'0 0 6px', lineHeight:1.4 }}>{r.reason}</p>
              <p style={{ fontSize:12, color:MUTED, margin:0, lineHeight:1.6 }}>
                <span style={{ color:`${a.color}80`, fontWeight:600 }}>Evidence: </span>{r.evidence}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Strengths & Shadows ───────────────────────────────────────────────────────
function StrengthsAndShadows({ reveal, archName }: { reveal: Record<string,unknown>; archName: string }) {
  const strengths = (reveal.archetype_strengths as Array<{ title: string; description: string }>) ?? [];
  const shadows   = (reveal.archetype_shadows   as Array<{ title: string; description: string }>) ?? [];
  const a = getArch(archName);
  if (!strengths.length && !shadows.length) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
      <div style={{ background:`${a.color}06`, border:`1px solid ${a.color}25`, borderRadius:20, padding:'32px 32px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:`${a.color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={18} color={a.color} />
          </div>
          <div>
            <h3 style={{ fontSize:15, fontWeight:800, color:'white', margin:0 }}>Archetype Strengths</h3>
            <p style={{ fontSize:11, color:MUTED, margin:0 }}>What this identity empowers you to do</p>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {strengths.map((s, i) => (
            <div key={i} style={{ padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${a.color}15`, borderRadius:12 }}>
              <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <CheckCircle size={14} color={a.color} style={{ flexShrink:0, marginTop:2 }} />
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'white', margin:'0 0 5px' }}>{s.title}</p>
                  <p style={{ fontSize:12, color:TEXT, margin:0, lineHeight:1.6 }}>{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:20, padding:'32px 32px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'rgba(245,158,11,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Eye size={18} color={AMBER} />
          </div>
          <div>
            <h3 style={{ fontSize:15, fontWeight:800, color:'white', margin:0 }}>Jungian Shadow</h3>
            <p style={{ fontSize:11, color:MUTED, margin:0 }}>The unconscious blind spots of this archetype</p>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {shadows.map((s, i) => (
            <div key={i} style={{ padding:'14px 16px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(245,158,11,0.12)', borderRadius:12 }}>
              <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <AlertCircle size={14} color={AMBER} style={{ flexShrink:0, marginTop:2 }} />
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'white', margin:'0 0 5px' }}>{s.title}</p>
                  <p style={{ fontSize:12, color:TEXT, margin:0, lineHeight:1.6 }}>{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Named leaders ─────────────────────────────────────────────────────────────
function NamedLeaders({ reveal, archName }: { reveal: Record<string,unknown>; archName: string }) {
  const leaders = (reveal.named_leaders as Array<{ name: string; domain: string; archetype_expression: string; what_to_emulate: string }>) ?? [];
  const a = getArch(archName);
  if (!leaders.length) return null;
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:'36px 40px', marginBottom:20 }}>
      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:10, color:a.color, textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:700, margin:'0 0 6px' }}>Your Peer Cohort</p>
        <h2 style={{ fontSize:22, fontWeight:900, color:'white', margin:'0 0 6px' }}>Leaders Who Operate as {archName}</h2>
        <p style={{ fontSize:13, color:MUTED, margin:0 }}>Real executives who built authority from this exact position — study their playbook</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:14 }}>
        {leaders.map((l, i) => {
          const initials = l.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase();
          return (
            <div key={i} style={{
              background: i===0 ? `${a.color}08` : CARD2,
              border:`1px solid ${i===0 ? `${a.color}35` : 'rgba(255,255,255,0.07)'}`,
              borderRadius:16, padding:'22px 22px', position:'relative',
            }}>
              {i===0 && <div style={{ position:'absolute', top:12, right:12 }}><Star size={12} color={a.color} fill={a.color} /></div>}
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                <div style={{ width:48, height:48, borderRadius:14, flexShrink:0,
                  background:`linear-gradient(135deg, ${a.color}30, ${a.color}10)`,
                  border:`1.5px solid ${a.color}50`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:15, fontWeight:900, color:a.color }}>{initials}</div>
                <div>
                  <p style={{ fontSize:14, fontWeight:800, color:'white', margin:'0 0 2px' }}>{l.name}</p>
                  <p style={{ fontSize:11, color:MUTED, margin:0 }}>{l.domain}</p>
                </div>
              </div>
              <p style={{ fontSize:12, color:TEXT, margin:'0 0 12px', lineHeight:1.6 }}>{l.archetype_expression}</p>
              <div style={{ padding:'9px 12px', background:`${GOLD}08`, borderRadius:9, border:`1px solid ${GOLD}20` }}>
                <span style={{ fontSize:10, color:GOLD, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Emulate: </span>
                <span style={{ fontSize:12, color:TEXT }}>{l.what_to_emulate}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Peer LSI comparison ───────────────────────────────────────────────────────
function PeerLSIComparison({ reveal, lsi }: { reveal: Record<string,unknown>; lsi: number }) {
  const peers   = (reveal.peer_lsi_comparison as Array<{ name: string; role: string; estimated_lsi: number; visibility: string; archetype: string }>) ?? [];
  const peerAvg = (reveal.peer_average_lsi as number) ?? 0;
  if (!peers.length) return null;
  const all = [...peers.map(p => p.estimated_lsi), lsi];
  const max = Math.max(...all, 1);
  const gap = peerAvg - lsi;
  const lsiC = (s: number) => s>=70 ? GREEN : s>=55 ? GOLD : '#fb923c';
  const visC = (v: string) => v==='High' ? GREEN : v==='Medium' ? GOLD : '#fb923c';
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:'36px 40px', marginBottom:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <p style={{ fontSize:10, color:GOLD, textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:700, margin:'0 0 6px' }}>Competitive Intelligence</p>
          <h2 style={{ fontSize:22, fontWeight:900, color:'white', margin:'0 0 6px' }}>Comparative LSI Scores</h2>
          <p style={{ fontSize:13, color:MUTED, margin:0 }}>Where you stand against named peers in your sector</p>
        </div>
        {gap > 0 ? (
          <div style={{ padding:'10px 18px', background:'rgba(251,146,60,0.08)', border:'1px solid rgba(251,146,60,0.3)', borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
            <AlertTriangle size={14} color="#fb923c" />
            <span style={{ fontSize:13, fontWeight:700, color:'#fb923c' }}>{gap} pts below peer average</span>
          </div>
        ) : gap < 0 ? (
          <div style={{ padding:'10px 18px', background:`${GREEN}08`, border:`1px solid ${GREEN}25`, borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
            <TrendingUp size={14} color={GREEN} />
            <span style={{ fontSize:13, fontWeight:700, color:GREEN }}>{Math.abs(gap)} pts above peer average</span>
          </div>
        ) : null}
      </div>

      {/* Bar chart */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 60px 80px', gap:12, alignItems:'center' }}>
          <p style={{ fontSize:13, fontWeight:800, color:GOLD, margin:0 }}>★ You</p>
          <div style={{ height:10, background:'rgba(255,255,255,0.05)', borderRadius:5, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(lsi/max)*100}%`, background:lsiC(lsi), borderRadius:5, boxShadow:`0 0 10px ${lsiC(lsi)}60` }} />
          </div>
          <span style={{ fontSize:15, fontWeight:900, color:lsiC(lsi), textAlign:'right' }}>{lsi}</span>
          <span style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:700, textAlign:'center', background:`${GOLD}15`, border:`1px solid ${GOLD}30`, color:GOLD }}>You</span>
        </div>
        {peers.map((p, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'160px 1fr 60px 80px', gap:12, alignItems:'center' }}>
            <p style={{ fontSize:12, color:TEXT, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
            <div style={{ height:10, background:'rgba(255,255,255,0.05)', borderRadius:5, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(p.estimated_lsi/max)*100}%`, background:lsiC(p.estimated_lsi), borderRadius:5 }} />
            </div>
            <span style={{ fontSize:15, fontWeight:900, color:lsiC(p.estimated_lsi), textAlign:'right' }}>{p.estimated_lsi}</span>
            <span style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:700, textAlign:'center',
              background:`${visC(p.visibility)}15`, border:`1px solid ${visC(p.visibility)}30`, color:visC(p.visibility) }}>{p.visibility}</span>
          </div>
        ))}
        {peerAvg > 0 && (
          <div style={{ marginTop:6, paddingTop:12, borderTop:`1px solid ${BORDER}`,
            display:'grid', gridTemplateColumns:'160px 1fr 60px 80px', gap:12, alignItems:'center' }}>
            <p style={{ fontSize:11, color:MUTED, margin:0, fontStyle:'italic' }}>Peer average</p>
            <div style={{ height:2, background:MUTED, borderRadius:1, position:'relative' }}>
              <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${(peerAvg/max)*100}%`, background:MUTED }} />
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:MUTED, textAlign:'right' }}>{peerAvg}</span>
            <span />
          </div>
        )}
      </div>

      {/* Full table */}
      <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${BORDER}` }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 80px 90px 1.5fr',
          padding:'10px 16px', background:'rgba(255,255,255,0.03)', borderBottom:`1px solid ${BORDER}` }}>
          {['Name','Role','LSI','Visibility','Archetype'].map(h => (
            <span key={h} style={{ fontSize:10, color:MUTED, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>{h}</span>
          ))}
        </div>
        <div style={{ background:`${GOLD}06`, borderBottom:`1px solid ${BORDER}`, borderLeft:`3px solid ${GOLD}` }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 80px 90px 1.5fr', padding:'13px 13px' }}>
            <span style={{ fontSize:13, fontWeight:800, color:GOLD }}>★ You (Current)</span>
            <span style={{ fontSize:12, color:MUTED }}>—</span>
            <span style={{ fontSize:15, fontWeight:900, color:lsiC(lsi) }}>{lsi}</span>
            <span style={{ fontSize:11, fontWeight:700, color:GOLD }}>Current</span>
            <span style={{ fontSize:11, color:MUTED }}>Your archetype</span>
          </div>
        </div>
        {peers.map((p, i) => (
          <div key={i} style={{ borderBottom: i<peers.length-1 ? `1px solid rgba(255,255,255,0.04)` : 'none' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 80px 90px 1.5fr',
              padding:'13px 16px', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <span style={{ fontSize:13, fontWeight:600, color:'white' }}>{p.name}</span>
              <span style={{ fontSize:12, color:MUTED }}>{p.role}</span>
              <span style={{ fontSize:15, fontWeight:900, color:lsiC(p.estimated_lsi) }}>{p.estimated_lsi}</span>
              <span style={{ fontSize:11, fontWeight:600, color:visC(p.visibility) }}>{p.visibility}</span>
              <span style={{ fontSize:11, color:MUTED }}>{p.archetype}</span>
            </div>
          </div>
        ))}
      </div>

      {gap > 5 && (
        <div style={{ marginTop:20, padding:'16px 20px', background:'rgba(251,146,60,0.05)', border:'1px solid rgba(251,146,60,0.2)', borderRadius:12 }}>
          <p style={{ fontSize:13, color:'#fdba74', margin:0, lineHeight:1.6 }}>
            <strong style={{ color:'#fb923c' }}>The gap is real:</strong>{' '}
            Your peers average LSI {peerAvg}. A {gap}-point gap means less inbound media, fewer speaking invitations,
            lower deal flow. The platform below closes this gap systematically.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Transition case studies ───────────────────────────────────────────────────
function TransitionCaseStudies({ reveal }: { reveal: Record<string,unknown> }) {
  const success = reveal.transition_success as Record<string,string> | null;
  const failure = reveal.transition_failure as Record<string,string> | null;
  const tales   = (reveal.cautionary_tales as Array<{ name: string; what_happened: string; archetype_failure: string; lesson: string }>) ?? [];
  if (!success && !failure && !tales.length) return null;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
      {success?.name && (
        <div style={{ background:'rgba(74,222,128,0.04)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:20, padding:'32px 32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`${GREEN}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingUp size={18} color={GREEN} />
            </div>
            <div>
              <h3 style={{ fontSize:14, fontWeight:800, color:GREEN, margin:0 }}>The Successful Transition</h3>
              <p style={{ fontSize:11, color:MUTED, margin:0 }}>What reputation engineering delivered</p>
            </div>
          </div>
          <div style={{ padding:'14px 18px', background:`${GREEN}06`, borderRadius:12, marginBottom:18 }}>
            <p style={{ fontSize:16, fontWeight:900, color:GREEN, margin:'0 0 2px' }}>{success.name}</p>
            <p style={{ fontSize:12, color:MUTED, margin:0 }}>{success.industry}</p>
          </div>
          {[{label:'Before',color:MUTED,value:success.before},{label:'After',color:GREEN,value:success.after},{label:'Key Move',color:GOLD,value:success.key_move}]
            .filter(x=>x.value).map(({label,color,value})=>(
            <div key={label} style={{ marginBottom:12 }}>
              <p style={{ fontSize:10, color, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, margin:'0 0 4px' }}>{label}</p>
              <p style={{ fontSize:12, color:TEXT, margin:0, lineHeight:1.6 }}>{value}</p>
            </div>
          ))}
          {success.how_long && <p style={{ fontSize:11, color:MUTED, margin:'8px 0 0' }}>Timeframe: {success.how_long}</p>}
        </div>
      )}
      <div style={{ background:`${RED}04`, border:`1px solid ${RED}20`, borderRadius:20, padding:'32px 32px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:`${RED}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Flame size={18} color={RED} />
          </div>
          <div>
            <h3 style={{ fontSize:14, fontWeight:800, color:RED, margin:0 }}>Cautionary Tales</h3>
            <p style={{ fontSize:11, color:MUTED, margin:0 }}>What this archetype looks like when it fails</p>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {tales.map((t, i) => (
            <div key={i} style={{ padding:'16px 18px', background:`${RED}04`, border:`1px solid ${RED}15`, borderRadius:12 }}>
              <p style={{ fontSize:14, fontWeight:800, color:'#fca5a5', margin:'0 0 8px' }}>{t.name}</p>
              <p style={{ fontSize:12, color:TEXT, margin:'0 0 8px', lineHeight:1.6 }}>{t.what_happened}</p>
              <p style={{ fontSize:11, color:MUTED, margin:'0 0 8px' }}>
                <span style={{ color:`${RED}90`, fontWeight:600 }}>Failure: </span>{t.archetype_failure}
              </p>
              <div style={{ padding:'8px 12px', background:`${GOLD}08`, borderRadius:8, border:`1px solid ${GOLD}15` }}>
                <span style={{ fontSize:10, color:GOLD, fontWeight:700 }}>LESSON: </span>
                <span style={{ fontSize:11, color:TEXT }}>{t.lesson}</span>
              </div>
            </div>
          ))}
          {failure?.name && (
            <div style={{ padding:'16px 18px', background:`${RED}04`, border:`1px solid ${RED}15`, borderRadius:12 }}>
              <p style={{ fontSize:14, fontWeight:800, color:'#fca5a5', margin:'0 0 8px' }}>{failure.name}</p>
              {failure.what_happened && <p style={{ fontSize:12, color:TEXT, margin:'0 0 8px', lineHeight:1.6 }}>{failure.what_happened}</p>}
              {failure.root_cause && <p style={{ fontSize:11, color:MUTED, margin:'0 0 8px' }}><span style={{ color:`${RED}90`, fontWeight:600 }}>Root cause: </span>{failure.root_cause}</p>}
              {failure.lesson && (
                <div style={{ padding:'8px 12px', background:`${GOLD}08`, borderRadius:8, border:`1px solid ${GOLD}15` }}>
                  <span style={{ fontSize:10, color:GOLD, fontWeight:700 }}>LESSON: </span>
                  <span style={{ fontSize:11, color:TEXT }}>{failure.lesson}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Followability breakdown ───────────────────────────────────────────────────
function FollowabilityBreakdown({ pos, archName }: { pos: Record<string,unknown>; archName: string }) {
  const foll    = (pos.followability_score as number) ?? 0;
  const factors = (pos.followability_factors as Record<string,number>) ?? {};
  const a       = getArch(archName);
  const labels: Record<string,string> = {
    uniqueness:'Archetype Uniqueness', emotionalResonance:'Emotional Resonance',
    contentOpportunity:'Content Opportunity', platformFit:'Platform Fit',
    historicalPerformance:'Peer Performance',
  };
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:'36px 40px', marginBottom:20 }}>
      <div style={{ marginBottom:28 }}>
        <p style={{ fontSize:10, color:a.color, textTransform:'uppercase', letterSpacing:'0.15em', fontWeight:700, margin:'0 0 6px' }}>Audience Growth Model</p>
        <h2 style={{ fontSize:22, fontWeight:900, color:'white', margin:0 }}>Followability Score</h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:40, alignItems:'center' }}>
        <div style={{ textAlign:'center', padding:'28px 20px', background:`${a.color}08`, border:`1px solid ${a.color}25`, borderRadius:18 }}>
          <div style={{ fontSize:56, fontWeight:900, color:a.color, lineHeight:1, textShadow:`0 0 40px ${a.glow}50` }}>{foll}</div>
          <div style={{ fontSize:10, color:MUTED, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:6 }}>/ 100</div>
          <p style={{ fontSize:11, color:TEXT, margin:'10px 0 0', lineHeight:1.5 }}>
            {foll>=75 ? 'Strong growth potential' : foll>=55 ? 'Good — 2-3 improvements needed' : 'Significant upside available'}
          </p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {Object.entries(factors).map(([key, val]) => {
            const v = typeof val==='number' ? val : 0;
            const c = v>=70 ? GREEN : v>=50 ? GOLD : '#fb923c';
            return (
              <div key={key}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, color:TEXT }}>{labels[key] ?? key}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:c }}>{v}%</span>
                </div>
                <div style={{ height:8, background:'rgba(255,255,255,0.05)', borderRadius:4 }}>
                  <div style={{ height:'100%', width:`${v}%`, background:c, borderRadius:4, boxShadow:`0 0 8px ${c}40` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Content pillars ───────────────────────────────────────────────────────────
function ContentPillars({ pos, archName }: { pos: Record<string,unknown>; archName: string }) {
  const pillars = (pos.content_pillars as Array<{ name: string; themes: string[]; frequency: string; formats: string[] }>) ?? [];
  const lines   = (pos.signature_lines as string[]) ?? [];
  const stmt    = pos.positioning_statement as string ?? '';
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState<number|null>(null);
  const a = getArch(archName);

  function copy(line: string, i: number) {
    navigator.clipboard.writeText(line);
    setCopied(i); setTimeout(() => setCopied(null), 2000);
  }
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, marginBottom:20, overflow:'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:'100%', padding:'24px 32px', background:'none', border:'none', cursor:'pointer',
        display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'inherit' }}>
        <div style={{ textAlign:'left' }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:'white', margin:0 }}>Content Strategy & Pillars</h3>
          <p style={{ fontSize:12, color:MUTED, margin:'3px 0 0' }}>{pillars.length} pillars · Positioning statement · Signature lines</p>
        </div>
        {open ? <ChevronUp size={18} color={MUTED} /> : <ChevronDown size={18} color={MUTED} />}
      </button>
      {open && (
        <div style={{ borderTop:`1px solid ${BORDER}`, padding:'0 32px 32px' }}>
          {stmt && (
            <div style={{ margin:'24px 0', padding:'16px 20px', background:`${GOLD}08`, borderRadius:12, border:`1px solid ${GOLD}25` }}>
              <p style={{ fontSize:10, color:GOLD, textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 6px' }}>Positioning Statement</p>
              <p style={{ fontSize:14, color:'white', fontWeight:600, margin:0, lineHeight:1.6, fontStyle:'italic' }}>&ldquo;{stmt}&rdquo;</p>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12, marginBottom:24 }}>
            {pillars.map((p, i) => (
              <div key={i} style={{ background:CARD2, borderRadius:14, padding:'18px 18px', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ width:26, height:26, borderRadius:8, background:`${a.color}15`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:a.color }}>P{i+1}</div>
                  <p style={{ fontSize:13, fontWeight:800, color:'white', margin:0 }}>{p.name}</p>
                </div>
                <p style={{ fontSize:11, color:GOLD, margin:'0 0 10px' }}>{p.frequency}</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
                  {(p.themes ?? []).map((t, ti) => (
                    <span key={ti} style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'rgba(255,255,255,0.05)', color:TEXT }}>{t}</span>
                  ))}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {(p.formats ?? []).map((f, fi) => (
                    <span key={fi} style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:`${a.color}12`, color:a.color, border:`1px solid ${a.color}25` }}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {lines.length > 0 && (
            <div>
              <p style={{ fontSize:11, color:MUTED, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Signature Lines</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {lines.map((l, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 16px', background:`${GOLD}06`, borderRadius:10, border:`1px solid ${GOLD}18` }}>
                    <p style={{ fontSize:13, color:TEXT, margin:0, flex:1, lineHeight:1.5 }}>{l}</p>
                    <button onClick={() => copy(l, i)} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', color:MUTED, marginLeft:12 }}>
                      {copied===i ? <Check size={13} color={GREEN} /> : <Copy size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PositionPage() {
  const { id: clientId } = useParams() as { id: string };
  const [client,    setClient]    = useState<Record<string,unknown> | null>(null);
  const [lsiScore,  setLsiScore]  = useState(0);
  const [pos,       setPos]       = useState<Record<string,unknown> | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    const [{ data: c }, { data: lsi }, { data: p }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('lsi_runs').select('total_score').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('positioning').select('*').eq('client_id', clientId).maybeSingle(),
    ]);
    setClient(c);
    setLsiScore((lsi?.total_score as number) ?? 0);
    setPos(p);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function runAnalysis() {
    setAnalysing(true); setError('');
    try {
      const res  = await fetch('/api/archetype/assign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
        signal: AbortSignal.timeout(130_000),
      });
      const data = await res.json() as Record<string,unknown>;
      if (!res.ok) throw new Error((data.message ?? data.error ?? 'Analysis failed') as string);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally { setAnalysing(false); }
  }

  const clientName = (client?.name as string) ?? '';
  const reveal     = pos ? ((pos.archetype_reveal ?? pos.archetypeReveal ?? {}) as Record<string,unknown>) : {};

  return (
    <div style={{ color:'white', fontFamily:"'Inter', system-ui, sans-serif", paddingBottom:80, background:BG, minHeight:'100vh' }}>
      <style>{`
        @keyframes spinSlow { to { transform: rotate(360deg) } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes float    { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
        * { box-sizing: border-box; }
      `}</style>

      {loading && <div style={{ padding:'40px' }}><AnalysingOverlay clientName="…" /></div>}
      {!loading && analysing && <div style={{ padding:'40px' }}><AnalysingOverlay clientName={clientName} /></div>}

      {!loading && !analysing && !pos && (
        <div style={{ padding:'40px' }}>
          {error && (
            <div style={{ marginBottom:20, padding:'12px 16px', background:`${RED}12`, border:`1px solid ${RED}30`,
              borderRadius:10, fontSize:13, color:'#fca5a5', maxWidth:600, margin:'0 auto 20px' }}>
              <AlertTriangle size={13} style={{ marginRight:6, verticalAlign:'middle' }} />{error}
            </div>
          )}
          <PreRevealGate clientName={clientName} onReveal={runAnalysis} loading={analysing} />
        </div>
      )}

      {!loading && !analysing && pos && (
        <div style={{ padding:'32px 40px', animation:'fadeUp 0.5s ease' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
            <div>
              <p style={{ fontSize:10, color:GOLD, textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:700, margin:'0 0 6px' }}>Module 3 of 6 · Position</p>
              <h1 style={{ fontSize:26, fontWeight:900, color:'white', margin:0 }}>Strategic Positioning</h1>
            </div>
            <button onClick={runAnalysis} disabled={analysing} style={{
              padding:'10px 18px', background:'transparent', color:GOLD,
              border:`1px solid ${GOLD}40`, borderRadius:9, cursor:'pointer',
              fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:7, fontFamily:'inherit' }}>
              <RefreshCw size={13} /> Re-analyse
            </button>
          </div>

          {error && (
            <div style={{ marginBottom:20, padding:'12px 16px', background:`${RED}12`, border:`1px solid ${RED}30`, borderRadius:10, fontSize:13, color:'#fca5a5' }}>
              <AlertTriangle size={13} style={{ marginRight:6, verticalAlign:'middle' }} />{error}
            </div>
          )}

          <ArchetypeHero          pos={pos} lsi={lsiScore} />
          <WhyThisArchetype       reveal={reveal} archName={(pos.personal_archetype as string) ?? ''} />
          <StrengthsAndShadows    reveal={reveal} archName={(pos.personal_archetype as string) ?? ''} />
          <NamedLeaders           reveal={reveal} archName={(pos.personal_archetype as string) ?? ''} />
          <PeerLSIComparison      reveal={reveal} lsi={lsiScore} />
          <TransitionCaseStudies  reveal={reveal} />
          <FollowabilityBreakdown pos={pos} archName={(pos.personal_archetype as string) ?? ''} />
          <ContentPillars         pos={pos} archName={(pos.personal_archetype as string) ?? ''} />

          <div style={{
            padding:'36px 40px',
            background:'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(8,12,20,0) 100%)',
            border:`1px solid ${GOLD}30`, borderRadius:20,
            display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20,
          }}>
            <div>
              <p style={{ fontSize:10, color:GOLD, textTransform:'uppercase', letterSpacing:'0.14em', fontWeight:700, margin:'0 0 8px' }}>Position Locked — What&apos;s Next?</p>
              <h3 style={{ fontSize:22, fontWeight:900, color:'white', margin:'0 0 8px' }}>Start Creating Content for This Position</h3>
              <p style={{ fontSize:13, color:MUTED, margin:0, maxWidth:500 }}>
                Your archetype is set. Express generates thought leadership perfectly aligned to your strategic identity — LinkedIn posts, op-eds, keynote outlines, all in your voice.
              </p>
            </div>
            <a href={`/dashboard/clients/${clientId}/express`} style={{
              padding:'16px 32px', background:GOLD, color:'#080C14',
              fontWeight:900, fontSize:15, borderRadius:12, border:'none',
              cursor:'pointer', textDecoration:'none',
              display:'inline-flex', alignItems:'center', gap:8, whiteSpace:'nowrap', letterSpacing:'-0.01em',
            }}>
              Create Content for This Position →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
