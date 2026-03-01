'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  RefreshCw, AlertTriangle, ArrowRight, CheckCircle, Zap,
  Activity, Search, Newspaper, Users, Award, BookOpen, ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD = '#C9A84C';
const CARD = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';

const COMPONENTS = [
  { id: 'c1', name: 'Search Reputation',     max: 20, icon: Search,     color: '#818cf8', target: 16 },
  { id: 'c2', name: 'Media Framing',          max: 20, icon: Newspaper,  color: '#34d399', target: 16 },
  { id: 'c3', name: 'Social Backlash',        max: 20, icon: Users,      color: '#60a5fa', target: 16 },
  { id: 'c4', name: 'Elite Discourse',        max: 15, icon: BookOpen,   color: '#f472b6', target: 12 },
  { id: 'c5', name: 'Third-Party Validation', max: 15, icon: Award,      color: '#fb923c', target: 12 },
  { id: 'c6', name: 'Crisis Moat',            max: 10, icon: ShieldCheck,color: '#4ade80', target: 8  },
];

function getLabel(s: number) {
  if (s >= 86) return { label: 'Elite Authority',          color: '#4ade80' };
  if (s >= 71) return { label: 'Strong Authority',         color: '#34d399' };
  if (s >= 56) return { label: 'Functional Legitimacy',    color: GOLD      };
  if (s >= 36) return { label: 'Reputation Vulnerability', color: '#fb923c' };
  return              { label: 'Severe Impairment',        color: '#f87171' };
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DiagnosePage() {
  const params   = useParams();
  const router   = useRouter();
  const clientId = params.id as string;

  const [lsi,         setLsi]         = useState<Record<string,unknown> | null>(null);
  const [prevLsi,     setPrevLsi]     = useState<Record<string,unknown> | null>(null);
  const [history,     setHistory]     = useState<{ date: string; score: number }[]>([]);
  const [discover,    setDiscover]    = useState<Record<string,unknown> | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error,       setError]       = useState('');
  const [done,        setDone]        = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: dr } = await supabase
      .from('discover_runs')
      .select('id,status,total_mentions,sentiment_dist,frame_dist,top_keywords,analysis_summary,archetype_hints,crisis_signals,created_at')
      .eq('client_id', clientId).eq('status', 'completed')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    setDiscover(dr ?? null);

    const { data: runs } = await supabase
      .from('lsi_runs').select('*')
      .eq('client_id', clientId)
      .order('run_date', { ascending: false }).limit(2);
    if (runs?.length) { setLsi(runs[0]); if (runs[1]) setPrevLsi(runs[1]); }

    const { data: hist } = await supabase
      .from('lsi_runs').select('run_date,total_score')
      .eq('client_id', clientId)
      .order('run_date', { ascending: true }).limit(24);
    setHistory((hist ?? []).map(r => ({ date: r.run_date, score: r.total_score })));
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function runLSI() {
    setCalculating(true); setError('');
    try {
      const res  = await fetch('/api/lsi/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Calculation failed');
      setDone(true); await load(); setTimeout(() => setDone(false), 4000);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setCalculating(false); }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const components = (lsi?.components ?? {}) as Record<string, number>;
  const total      = (lsi?.total_score as number) ?? 0;
  const cl         = lsi ? getLabel(total) : null;
  const prev       = prevLsi ? (prevLsi.total_score as number) : null;
  const diff       = prev !== null ? total - prev : null;

  const radarData = COMPONENTS.map(c => ({
    subject: c.name.split(' ')[0],
    score:   Math.min(((components[c.id] ?? 0) / c.max) * 100, 100),
    target:  80,
  }));

  const gapData = COMPONENTS.map(c => ({
    name:  c.name.replace('Third-Party', '3rd-Party'),
    gap:   Math.max(c.target - (components[c.id] ?? 0), 0),
    color: c.color,
  })).sort((a, b) => b.gap - a.gap);

  const sentDist   = (discover?.sentiment_dist as Record<string,number>) ?? {};
  const frameDist  = (discover?.frame_dist  as Record<string,number>) ?? {};
  const keywords   = (discover?.top_keywords as string[]) ?? [];
  const arcHints   = (discover?.archetype_hints as string[]) ?? [];
  const crisisSigs = (discover?.crisis_signals as string[]) ?? [];
  const summary    = (discover?.analysis_summary as string) ?? '';
  const stats      = (lsi?.stats as Record<string,number>) ?? {};

  const frameData = Object.entries(frameDist)
    .filter(([,v]) => v > 0).sort(([,a],[,b]) => b - a)
    .map(([k,v]) => ({ name: k[0].toUpperCase()+k.slice(1), value: v }));

  const card: React.CSSProperties = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '60vh', display:'flex', alignItems:'center', justifyContent:'center', color: GOLD }}>
      <RefreshCw size={22} style={{ animation:'spin 1s linear infinite', marginRight:10 }} /> Loading diagnosis...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ color:'white', fontFamily:"'Inter',system-ui,sans-serif", paddingBottom:60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'white', marginBottom:4 }}>Diagnose</h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>LSI scoring · Frame analysis · Gap identification</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {lsi && (
            <button onClick={runLSI} disabled={calculating||!discover} style={{
              padding:'9px 16px', borderRadius:8, border:`1px solid ${BORDER}`,
              background:'transparent', color:'rgba(255,255,255,0.7)', fontSize:13, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6,
            }}>
              <RefreshCw size={13} style={calculating?{animation:'spin 1s linear infinite'}:{}} />
              {calculating ? 'Recalculating…' : 'Recalculate LSI'}
            </button>
          )}
          {lsi && (
            <button onClick={() => router.push(`/dashboard/clients/${clientId}/position`)} style={{
              padding:'9px 18px', borderRadius:8, background:GOLD, color:'#080C14',
              fontWeight:700, fontSize:13, border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', gap:6,
            }}>
              Go to Position <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Toasts */}
      {done && (
        <div style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:8, padding:'11px 16px', marginBottom:18, display:'flex', alignItems:'center', gap:8, color:'#4ade80', fontSize:13 }}>
          <CheckCircle size={15} /> LSI calculated from latest scan data.
        </div>
      )}
      {error && (
        <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:8, padding:'11px 16px', marginBottom:18, color:'#f87171', fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Empty */}
      {!lsi && (
        <div style={{ textAlign:'center', padding:'80px 24px' }}>
          <Activity size={44} color={GOLD} style={{ margin:'0 auto 20px', display:'block', opacity:0.5 }} />
          <h2 style={{ fontSize:20, fontWeight:700, color:'white', marginBottom:8 }}>No LSI Data Yet</h2>
          {!discover ? (
            <>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, maxWidth:360, margin:'0 auto 24px' }}>
                Run Discovery first to collect data from 62 sources. LSI is derived from that data.
              </p>
              <button onClick={() => router.push(`/dashboard/clients/${clientId}/discover`)}
                style={{ padding:'11px 26px', borderRadius:8, background:GOLD, color:'#080C14', fontWeight:700, fontSize:14, border:'none', cursor:'pointer' }}>
                Go to Discover →
              </button>
            </>
          ) : (
            <>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, maxWidth:360, margin:'0 auto 24px' }}>
                Discovery scan found. Click below — LSI derives automatically from your 62-source scan data.
              </p>
              <button onClick={runLSI} disabled={calculating} style={{
                padding:'12px 28px', borderRadius:8, background:calculating?'rgba(201,168,76,0.4)':GOLD,
                color:'#080C14', fontWeight:700, fontSize:14, border:'none', cursor:calculating?'wait':'pointer',
                display:'inline-flex', alignItems:'center', gap:8,
              }}>
                {calculating
                  ? <><RefreshCw size={15} style={{ animation:'spin 1s linear infinite' }} /> Calculating…</>
                  : <><Zap size={15} /> Calculate My LSI Score</>}
              </button>
            </>
          )}
        </div>
      )}

      {/* Main content */}
      {lsi && (
        <>
          {/* Hero score */}
          <div style={{
            background:`linear-gradient(135deg,rgba(201,168,76,0.1) 0%,rgba(13,17,23,0.8) 100%)`,
            border:`1px solid ${BORDER}`, borderRadius:14, padding:'28px 32px',
            marginBottom:20, display:'flex', alignItems:'center', gap:36, flexWrap:'wrap',
          }}>
            <div style={{ textAlign:'center', minWidth:110 }}>
              <div style={{ fontSize:60, fontWeight:900, color:cl?.color, lineHeight:1 }}>{Math.round(total)}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>/100</div>
              <div style={{ marginTop:8, padding:'3px 10px', borderRadius:20, background:`${cl?.color}20`, display:'inline-block', fontSize:11, fontWeight:600, color:cl?.color }}>
                {cl?.label}
              </div>
            </div>
            <div style={{ width:1, height:72, background:BORDER, flexShrink:0 }} />
            <div style={{ flex:1, display:'flex', gap:28, flexWrap:'wrap' }}>
              {[
                { label:'Change',     val: diff === null ? '—' : diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1), color: diff === null ? 'rgba(255,255,255,0.4)' : diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : 'rgba(255,255,255,0.6)', sub:'from baseline' },
                { label:'Mentions',   val: (discover?.total_mentions as number)?.toLocaleString() ?? '—', color:'white', sub:'across 62 sources' },
                { label:'Positive',   val: sentDist.positive !== undefined ? `${sentDist.positive}%` : '—', color:'#4ade80', sub:'sentiment' },
                { label:'Calculated', val: fmt(lsi.run_date as string), color:'white', sub:'last run', small:true },
              ].map(({ label, val, color, sub, small }) => (
                <div key={label}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize: small ? 13 : 20, fontWeight:700, color }}>{val}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Component bars */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:12, marginBottom:20 }}>
            {COMPONENTS.map(c => {
              const val = components[c.id] ?? 0;
              const pct = Math.min((val/c.max)*100, 100);
              const tpct= Math.min((c.target/c.max)*100, 100);
              const gap = Math.max(c.target - val, 0);
              const ok  = val >= c.target;
              const Icon= c.icon;
              return (
                <div key={c.id} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, padding:'14px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:9 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <div style={{ width:30, height:30, borderRadius:7, background:`${c.color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon size={14} color={c.color} />
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:'white' }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize:18, fontWeight:700, color:c.color }}>{val.toFixed(1)}<span style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>/{c.max}</span></span>
                  </div>
                  <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, position:'relative' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:c.color, borderRadius:3, transition:'width 0.8s ease' }} />
                    <div style={{ position:'absolute', top:-3, left:`${tpct}%`, width:2, height:11, background:'rgba(255,255,255,0.25)', borderRadius:1 }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                    <span style={{ fontSize:11, color: ok ? '#4ade80' : gap <= 2 ? GOLD : '#f87171' }}>
                      {ok ? '✓ On target' : `${gap.toFixed(1)} pt gap`}
                    </span>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Target {c.target}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <div style={card}>
              <h3 style={{ fontSize:13, fontWeight:600, color:GOLD, marginBottom:18, letterSpacing:'0.05em' }}>LSI RADAR</h3>
              <ResponsiveContainer width="100%" height={230}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill:'rgba(255,255,255,0.5)', fontSize:11 }} />
                  <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke={GOLD} fill={GOLD} fillOpacity={0.2} strokeWidth={2} />
                  <Radar dataKey="target" stroke="rgba(255,255,255,0.2)" fill="transparent" strokeDasharray="3 2" strokeWidth={1} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={card}>
              <h3 style={{ fontSize:13, fontWeight:600, color:GOLD, marginBottom:18, letterSpacing:'0.05em' }}>GAP ANALYSIS (PARETO)</h3>
              {gapData.every(d => d.gap === 0) ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#4ade80', flexDirection:'column', gap:8 }}>
                  <CheckCircle size={32} /><span style={{ fontSize:13, fontWeight:600 }}>All on target</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={gapData} layout="vertical" margin={{ left:90, right:12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill:'rgba(255,255,255,0.5)', fontSize:11 }} axisLine={false} width={90} />
                    <Tooltip contentStyle={{ background:'#1a1f2e', border:`1px solid ${BORDER}`, borderRadius:8 }}
                      formatter={(v: unknown) => [`${(v as number).toFixed(1)} pts`, 'Gap']} />
                    <Bar dataKey="gap" radius={[0,4,4,0]}>
                      {gapData.map((e,i) => <Cell key={i} fill={e.color} fillOpacity={0.8} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* LSI Trend */}
          {history.length > 1 && (
            <div style={{ ...card, marginBottom:20 }}>
              <h3 style={{ fontSize:13, fontWeight:600, color:GOLD, marginBottom:18, letterSpacing:'0.05em' }}>LSI TREND</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-IN',{month:'short',year:'2-digit'})}
                    tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} />
                  <YAxis domain={[0,100]} tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} />
                  <Tooltip contentStyle={{ background:'#1a1f2e', border:`1px solid ${BORDER}`, borderRadius:8 }}
                    formatter={(v: unknown) => [`${(v as number).toFixed(1)}`, 'LSI']} />
                  <ReferenceLine y={75} stroke={GOLD} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="score" stroke={GOLD} strokeWidth={2} dot={{ fill:GOLD, r:4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Frame + Keywords row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            {frameData.length > 0 && (
              <div style={card}>
                <h3 style={{ fontSize:13, fontWeight:600, color:GOLD, marginBottom:18, letterSpacing:'0.05em' }}>LINGUISTIC FRAMES</h3>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={frameData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill:'rgba(255,255,255,0.5)', fontSize:11 }} axisLine={false} />
                    <YAxis unit="%" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} />
                    <Tooltip contentStyle={{ background:'#1a1f2e', border:`1px solid ${BORDER}`, borderRadius:8 }}
                      formatter={(v: unknown) => [`${v as number}%`, 'Frame %']} />
                    <Bar dataKey="value" fill={GOLD} fillOpacity={0.7} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {keywords.length > 0 && (
                <div style={card}>
                  <h3 style={{ fontSize:12, fontWeight:600, color:GOLD, marginBottom:12, letterSpacing:'0.05em' }}>TOP KEYWORDS</h3>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {keywords.slice(0,10).map((kw,i) => (
                      <span key={i} style={{ padding:'3px 9px', borderRadius:20, background:'rgba(201,168,76,0.1)', border:`1px solid ${BORDER}`, fontSize:11, color:GOLD }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {arcHints.length > 0 && (
                <div style={card}>
                  <h3 style={{ fontSize:12, fontWeight:600, color:GOLD, marginBottom:12, letterSpacing:'0.05em' }}>ARCHETYPE SIGNALS</h3>
                  {arcHints.map((h,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:GOLD, flexShrink:0 }} />
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>{h}</span>
                    </div>
                  ))}
                </div>
              )}
              {crisisSigs.length > 0 && (
                <div style={{ background:'rgba(248,113,113,0.05)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:12, padding:18 }}>
                  <h3 style={{ fontSize:12, fontWeight:600, color:'#f87171', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                    <AlertTriangle size={13} /> RISK SIGNALS
                  </h3>
                  {crisisSigs.map((s,i) => <div key={i} style={{ fontSize:12, color:'#fca5a5', marginBottom:4 }}>{s}</div>)}
                </div>
              )}
            </div>
          </div>

          {/* AI Narrative */}
          {summary && (
            <div style={{ ...card, marginBottom:20 }}>
              <h3 style={{ fontSize:13, fontWeight:600, color:GOLD, marginBottom:14, letterSpacing:'0.05em' }}>AI REPUTATION NARRATIVE</h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.75 }}>{summary}</p>
            </div>
          )}

          {/* Six Sigma stats */}
          {Object.keys(stats).length > 0 && (
            <div style={{ ...card, marginBottom:20 }}>
              <h3 style={{ fontSize:13, fontWeight:600, color:GOLD, marginBottom:18, letterSpacing:'0.05em' }}>SIX SIGMA BASELINE</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
                {[
                  { l:'Mean Score',   v: stats.mean?.toFixed(1),   u:'/100' },
                  { l:'Std Deviation',v: stats.stddev?.toFixed(2),  u:'σ'   },
                  { l:'UCL',          v: stats.ucl?.toFixed(1),     u:'/100' },
                  { l:'LCL',          v: stats.lcl?.toFixed(1),     u:'/100' },
                ].map(({ l, v, u }) => (
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:700, color:GOLD }}>{v ?? '—'}<span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginLeft:2 }}>{u}</span></div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:3 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next step CTA */}
          <div style={{
            background:`linear-gradient(135deg,rgba(201,168,76,0.1) 0%,rgba(13,17,23,0.5) 100%)`,
            border:`1px solid ${BORDER}`, borderRadius:12, padding:22,
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap',
          }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:'white', marginBottom:4 }}>Ready to run Archetype Analysis?</h3>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>Position module uses this LSI + scan data to assign your archetype and build a full content strategy.</p>
            </div>
            <button onClick={() => router.push(`/dashboard/clients/${clientId}/position`)} style={{
              padding:'11px 22px', borderRadius:8, background:GOLD, color:'#080C14',
              fontWeight:700, fontSize:13, border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap',
            }}>
              Go to Position <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
