'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LineChart, Line, ReferenceLine,
} from 'recharts';
import {
  RefreshCw, AlertTriangle, ArrowRight, CheckCircle, Zap, Activity,
  Search, Newspaper, Users, Award, BookOpen, ShieldCheck, TrendingUp,
  TrendingDown, Minus, ChevronDown, ChevronUp, Target, Lightbulb, Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';
const BG     = '#080C14';

const COMPONENTS = [
  { id:'c1', name:'Search Reputation',     max:20, icon:Search,     color:'#818cf8', target:16,
    desc:'How your name appears across search engines and AI tools. Measures visibility, narrative control, and first-impression authority.' },
  { id:'c2', name:'Media Framing',          max:20, icon:Newspaper,  color:'#34d399', target:16,
    desc:'The frame journalists and media use when covering you. Expert quotes, tier-1 placements, and authored bylines drive this score.' },
  { id:'c3', name:'Social Backlash Resistance', max:20, icon:Users,  color:'#60a5fa', target:16,
    desc:'Your resilience to public criticism. Measures sentiment stability, engagement quality, and absence of viral negative episodes.' },
  { id:'c4', name:'Elite Discourse',        max:15, icon:BookOpen,   color:'#f472b6', target:12,
    desc:'Presence in high-status conversations — Davos-tier conferences, peer citations, advisory roles, and policy forums.' },
  { id:'c5', name:'Third-Party Validation', max:15, icon:Award,      color:'#fb923c', target:12,
    desc:'External endorsements independent of your employer — awards, analyst mentions, rankings, academic citations, government affiliations.' },
  { id:'c6', name:'Crisis Moat',            max:10, icon:ShieldCheck, color:'#4ade80', target:8,
    desc:'Your defensive infrastructure. Proactive narrative assets, crisis response history, and trust reserves that protect against reputational attacks.' },
];

const RISK_COLORS: Record<string,string> = { LOW:'#4ade80', MODERATE:GOLD, HIGH:'#f87171' };

function getLabel(s: number) {
  if (s >= 86) return { label:'Elite Authority',          color:'#4ade80' };
  if (s >= 71) return { label:'Strong Authority',         color:'#34d399' };
  if (s >= 56) return { label:'Functional Legitimacy',    color:GOLD      };
  if (s >= 36) return { label:'Reputation Vulnerability', color:'#fb923c' };
  return              { label:'Severe Impairment',        color:'#f87171' };
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' });
}

type ComponentRationale = {
  score_explanation: string;
  strengths: string[];
  gaps: string[];
  priority_action: string;
};
type RiskDimension = { dimension:string; current_signal:string; risk_level:string; assessment:string };
type Strength = { title:string; description:string };
type Intervention = { action:string; detail:string; impact:string };
type PeerRow = { name:string; company:string; primary_narrative:string; lsi_estimate:number; india_presence:string; personal_story:string };
type TargetMetric = { metric:string; current:string; target:string; delta:string };

export default function DiagnosePage() {
  const params   = useParams();
  const router   = useRouter();
  const clientId = params.id as string;

  const [lsi,         setLsi]         = useState<Record<string,unknown>|null>(null);
  const [prevLsi,     setPrevLsi]     = useState<Record<string,unknown>|null>(null);
  const [history,     setHistory]     = useState<{date:string;score:number}[]>([]);
  const [discover,    setDiscover]    = useState<Record<string,unknown>|null>(null);
  const [loading,     setLoading]     = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error,       setError]       = useState('');
  const [done,        setDone]        = useState(false);
  const [expandedComp, setExpandedComp] = useState<string|null>(null);
  const [narrativeReady, setNarrativeReady] = useState(false);
  const [pollCount,   setPollCount]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: dr } = await supabase
      .from('discover_runs')
      .select('id,status,total_mentions,sentiment_summary,frame_distribution,top_keywords,analysis_summary,archetype_hints,crisis_signals,created_at')
      .eq('client_id', clientId).eq('status','completed')
      .order('created_at',{ascending:false}).limit(1).maybeSingle();
    setDiscover(dr ?? null);

    const { data: runs } = await supabase
      .from('lsi_runs').select('*')
      .eq('client_id', clientId).order('run_date',{ascending:false}).limit(2);
    if (runs?.length) {
      setLsi(runs[0]);
      setNarrativeReady(!!(runs[0].component_rationale));
      if (runs[1]) setPrevLsi(runs[1]);
    }

    const { data: hist } = await supabase
      .from('lsi_runs').select('run_date,total_score')
      .eq('client_id', clientId).order('run_date',{ascending:true}).limit(24);
    setHistory((hist??[]).map(r=>({date:r.run_date,score:r.total_score})));
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  // Poll for narrative if not ready yet (AI generates async after LSI save)
  useEffect(() => {
    if (narrativeReady || !lsi || pollCount >= 8) return;
    const t = setTimeout(async () => {
      const { data } = await supabase.from('lsi_runs')
        .select('component_rationale,risk_heatmap,identified_strengths,risk_factors,intervention_plan,peer_comparison,target_state')
        .eq('id', lsi.id as string).single();
      if (data?.component_rationale) {
        setLsi(prev => prev ? {...prev, ...data} : prev);
        setNarrativeReady(true);
      } else {
        setPollCount(p => p+1);
      }
    }, 4000);
    return () => clearTimeout(t);
  }, [narrativeReady, lsi, pollCount]);

  async function runLSI() {
    setCalculating(true); setError(''); setNarrativeReady(false); setPollCount(0);
    try {
      const res  = await fetch('/api/lsi/calculate',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({clientId}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message||data.error||'Calculation failed');
      setDone(true); await load(); setTimeout(()=>setDone(false),4000);
    } catch(e) { setError(e instanceof Error ? e.message:'Unknown error'); }
    finally { setCalculating(false); }
  }

  const components  = (lsi?.components ?? {}) as Record<string,number>;
  const total       = (lsi?.total_score as number) ?? 0;
  const cl          = lsi ? getLabel(total) : null;
  const prev        = prevLsi ? (prevLsi.total_score as number) : null;
  const diff        = prev !== null ? total - prev : null;
  const sentDist    = (discover?.sentiment_summary as Record<string,number>) ?? {};
  const frameDist   = (discover?.frame_distribution as Record<string,number>) ?? {};
  const keywords    = (discover?.top_keywords as string[]) ?? [];
  const arcHints    = (discover?.archetype_hints as string[]) ?? [];
  const crisisSigs  = (discover?.crisis_signals as string[]) ?? [];
  const summary     = (discover?.analysis_summary as string) ?? '';
  const stats       = (lsi?.stats as Record<string,number>) ?? {};
  const rationale   = (lsi?.component_rationale as Record<string,ComponentRationale>) ?? {};
  const heatmap     = (lsi?.risk_heatmap as RiskDimension[]) ?? [];
  const strengths   = (lsi?.identified_strengths as Strength[]) ?? [];
  const risks       = (lsi?.risk_factors as Strength[]) ?? [];
  const interventions = lsi?.intervention_plan as { immediate:Intervention[]; medium_term:Intervention[]; long_term:Intervention[] } | null;
  const peers       = (lsi?.peer_comparison as PeerRow[]) ?? [];
  const targetState = lsi?.target_state as { timeframe:string; target_lsi:number; metrics:TargetMetric[] } | null;

  const radarData = COMPONENTS.map(c=>({
    subject: c.name.split(' ')[0],
    score:   Math.min(((components[c.id]??0)/c.max)*100,100),
    target:  80,
  }));

  const gapData = COMPONENTS.map(c=>({
    name:  c.name.replace('Third-Party','3rd-Party').replace('Backlash Resistance','Backlash'),
    gap:   Math.max(c.target-(components[c.id]??0),0),
    color: c.color,
  })).sort((a,b)=>b.gap-a.gap);

  const frameData = Object.entries(frameDist).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a)
    .map(([k,v])=>({name:k[0].toUpperCase()+k.slice(1),value:v}));

  const card: React.CSSProperties = { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:24 };

  if (loading) return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',color:GOLD}}>
      <RefreshCw size={22} style={{animation:'spin 1s linear infinite',marginRight:10}}/> Loading diagnosis...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{color:'white',fontFamily:"'Inter',system-ui,sans-serif",paddingBottom:60}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:'white',marginBottom:4}}>Diagnose</h1>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.4)'}}>LSI scoring · Identity risk · Strategic gap analysis</p>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {lsi && (
            <button onClick={runLSI} disabled={calculating||!discover} style={{
              padding:'9px 16px',borderRadius:8,border:`1px solid ${BORDER}`,
              background:'transparent',color:'rgba(255,255,255,0.7)',fontSize:13,cursor:'pointer',
              display:'flex',alignItems:'center',gap:6,
            }}>
              <RefreshCw size={13} style={calculating?{animation:'spin 1s linear infinite'}:{}}/>
              {calculating?'Recalculating…':'Recalculate LSI'}
            </button>
          )}
          {lsi && (
            <button onClick={()=>router.push(`/dashboard/clients/${clientId}/position`)} style={{
              padding:'9px 18px',borderRadius:8,background:GOLD,color:BG,
              fontWeight:700,fontSize:13,border:'none',cursor:'pointer',
              display:'flex',alignItems:'center',gap:6,
            }}>
              Go to Position <ArrowRight size={14}/>
            </button>
          )}
        </div>
      </div>

      {done&&<div style={{background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:8,padding:'11px 16px',marginBottom:18,display:'flex',alignItems:'center',gap:8,color:'#4ade80',fontSize:13}}><CheckCircle size={15}/> LSI calculated. Generating narrative analysis…</div>}
      {error&&<div style={{background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:8,padding:'11px 16px',marginBottom:18,color:'#f87171',fontSize:13,display:'flex',alignItems:'center',gap:8}}><AlertTriangle size={15}/>{error}</div>}

      {!lsi&&(
        <div style={{textAlign:'center',padding:'80px 24px'}}>
          <Activity size={44} color={GOLD} style={{margin:'0 auto 20px',display:'block',opacity:0.5}}/>
          <h2 style={{fontSize:20,fontWeight:700,color:'white',marginBottom:8}}>No LSI Data Yet</h2>
          {!discover?(
            <>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:14,maxWidth:360,margin:'0 auto 24px'}}>Run Discovery first to collect data. LSI is derived from your 62-source scan.</p>
              <button onClick={()=>router.push(`/dashboard/clients/${clientId}/discover`)} style={{padding:'11px 26px',borderRadius:8,background:GOLD,color:BG,fontWeight:700,fontSize:14,border:'none',cursor:'pointer'}}>Go to Discover →</button>
            </>
          ):(
            <>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:14,maxWidth:360,margin:'0 auto 24px'}}>Scan data found. Click below to calculate your LSI baseline.</p>
              <button onClick={runLSI} disabled={calculating} style={{padding:'12px 28px',borderRadius:8,background:calculating?'rgba(201,168,76,0.4)':GOLD,color:BG,fontWeight:700,fontSize:14,border:'none',cursor:calculating?'wait':'pointer',display:'inline-flex',alignItems:'center',gap:8}}>
                {calculating?<><RefreshCw size={15} style={{animation:'spin 1s linear infinite'}}/>Calculating…</>:<><Zap size={15}/>Calculate My LSI Score</>}
              </button>
            </>
          )}
        </div>
      )}

      {lsi&&(
        <>
          {/* ── HERO SCORE ── */}
          <div style={{background:'linear-gradient(135deg,rgba(201,168,76,0.1) 0%,rgba(13,17,23,0.8) 100%)',border:`1px solid ${BORDER}`,borderRadius:14,padding:'28px 32px',marginBottom:20,display:'flex',alignItems:'center',gap:36,flexWrap:'wrap'}}>
            <div style={{textAlign:'center',minWidth:110}}>
              <div style={{fontSize:64,fontWeight:900,color:cl?.color,lineHeight:1}}>{Math.round(total)}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',marginTop:2}}>/100</div>
              <div style={{marginTop:8,padding:'4px 12px',borderRadius:20,background:`${cl?.color}20`,display:'inline-block',fontSize:12,fontWeight:700,color:cl?.color}}>{cl?.label}</div>
            </div>
            <div style={{width:1,height:72,background:BORDER,flexShrink:0}}/>
            <div style={{flex:1,display:'flex',gap:28,flexWrap:'wrap'}}>
              {[
                {label:'Change',    val:diff===null?'—':diff>0?`+${diff.toFixed(1)}`:diff.toFixed(1), color:diff===null?'rgba(255,255,255,0.4)':diff>0?'#4ade80':diff<0?'#f87171':'rgba(255,255,255,0.6)', sub:'from baseline'},
                {label:'Mentions',  val:(discover?.total_mentions as number)?.toLocaleString()??'—', color:'white', sub:'across 62 sources'},
                {label:'Positive',  val:sentDist.positive!==undefined?`${sentDist.positive}%`:'—', color:'#4ade80', sub:'sentiment'},
                {label:'Calculated',val:fmt(lsi.run_date as string), color:'white', sub:'last run', small:true},
              ].map(({label,val,color,sub,small})=>(
                <div key={label}>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>{label}</div>
                  <div style={{fontSize:small?13:20,fontWeight:700,color}}>{val}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:2}}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── AI NARRATIVE STATUS ── */}
          {!narrativeReady&&(
            <div style={{background:'rgba(201,168,76,0.06)',border:`1px solid ${BORDER}`,borderRadius:8,padding:'11px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:8,color:'rgba(255,255,255,0.5)',fontSize:13}}>
              <RefreshCw size={13} style={{animation:'spin 1.5s linear infinite',color:GOLD}}/>
              <span>AI is generating your narrative analysis — scores show below, insights arrive in ~30 seconds...</span>
            </div>
          )}

          {/* ── COMPONENT BREAKDOWN WITH RATIONALE ── */}
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <h2 style={{fontSize:14,fontWeight:700,color:GOLD,letterSpacing:'0.05em',textTransform:'uppercase'}}>Component Breakdown</h2>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Click any component for analysis</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:12}}>
              {COMPONENTS.map(c=>{
                const val  = components[c.id]??0;
                const pct  = Math.min((val/c.max)*100,100);
                const tpct = Math.min((c.target/c.max)*100,100);
                const gap  = Math.max(c.target-val,0);
                const ok   = val>=c.target;
                const Icon = c.icon;
                const rat  = rationale[c.id];
                const open = expandedComp===c.id;
                return (
                  <div key={c.id} style={{background:CARD,border:`1px solid ${open?GOLD:BORDER}`,borderRadius:10,overflow:'hidden',transition:'border-color 200ms'}}>
                    <div onClick={()=>setExpandedComp(open?null:c.id)} style={{padding:'14px 18px',cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9}}>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                          <div style={{width:30,height:30,borderRadius:7,background:`${c.color}20`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Icon size={14} color={c.color}/>
                          </div>
                          <span style={{fontSize:13,fontWeight:600,color:'white'}}>{c.name}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:18,fontWeight:700,color:c.color}}>{val.toFixed(1)}<span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>/{c.max}</span></span>
                          {open?<ChevronUp size={13} color="rgba(255,255,255,0.3)"/>:<ChevronDown size={13} color="rgba(255,255,255,0.3)"/>}
                        </div>
                      </div>
                      <div style={{height:5,background:'rgba(255,255,255,0.07)',borderRadius:3,position:'relative'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:c.color,borderRadius:3,transition:'width 0.8s ease'}}/>
                        <div style={{position:'absolute',top:-3,left:`${tpct}%`,width:2,height:11,background:'rgba(255,255,255,0.25)',borderRadius:1}}/>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
                        <span style={{fontSize:11,color:ok?'#4ade80':gap<=2?GOLD:'#f87171'}}>{ok?'✓ On target':`${gap.toFixed(1)} pt gap`}</span>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Target {c.target}</span>
                      </div>
                    </div>

                    {open&&(
                      <div style={{borderTop:`1px solid ${BORDER}`,padding:'16px 18px',background:'rgba(255,255,255,0.02)'}}>
                        {/* What this measures */}
                        <p style={{fontSize:12,color:'rgba(255,255,255,0.45)',lineHeight:1.6,marginBottom:12,fontStyle:'italic'}}>{c.desc}</p>

                        {rat?(
                          <>
                            {/* Score explanation */}
                            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',lineHeight:1.7,marginBottom:14}}>{rat.score_explanation}</p>

                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                              {/* Strengths */}
                              {rat.strengths?.length>0&&(
                                <div>
                                  <div style={{fontSize:11,fontWeight:700,color:'#4ade80',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Strengths</div>
                                  {rat.strengths.map((s,i)=>(
                                    <div key={i} style={{display:'flex',gap:6,marginBottom:5}}>
                                      <span style={{color:'#4ade80',flexShrink:0,fontSize:10,marginTop:3}}>✓</span>
                                      <span style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.5}}>{s}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* Gaps */}
                              {rat.gaps?.length>0&&(
                                <div>
                                  <div style={{fontSize:11,fontWeight:700,color:'#f87171',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Gaps</div>
                                  {rat.gaps.map((g,i)=>(
                                    <div key={i} style={{display:'flex',gap:6,marginBottom:5}}>
                                      <span style={{color:'#f87171',flexShrink:0,fontSize:10,marginTop:3}}>→</span>
                                      <span style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.5}}>{g}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Priority action */}
                            {rat.priority_action&&(
                              <div style={{background:`rgba(201,168,76,0.08)`,border:`1px solid ${BORDER}`,borderRadius:7,padding:'10px 14px',display:'flex',gap:8,alignItems:'flex-start'}}>
                                <Target size={13} color={GOLD} style={{marginTop:2,flexShrink:0}}/>
                                <div>
                                  <div style={{fontSize:10,fontWeight:700,color:GOLD,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:3}}>Priority Action</div>
                                  <span style={{fontSize:12,color:'rgba(255,255,255,0.7)',lineHeight:1.6}}>{rat.priority_action}</span>
                                </div>
                              </div>
                            )}
                          </>
                        ):(
                          <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',fontStyle:'italic'}}>
                            {narrativeReady?'No analysis available.':'Analysis generating…'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── IDENTITY RISK HEATMAP ── */}
          {heatmap.length>0&&(
            <div style={{...card,marginBottom:20}}>
              <h2 style={{fontSize:14,fontWeight:700,color:GOLD,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:16}}>Identity Risk Heatmap</h2>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${BORDER}`}}>
                      {['Dimension','Current Signal','Risk Level','Assessment'].map(h=>(
                        <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.map((row,i)=>{
                      const rc = RISK_COLORS[row.risk_level]??'rgba(255,255,255,0.5)';
                      return (
                        <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                          <td style={{padding:'10px 12px',fontWeight:600,color:'white'}}>{row.dimension}</td>
                          <td style={{padding:'10px 12px',color:'rgba(255,255,255,0.55)'}}>{row.current_signal}</td>
                          <td style={{padding:'10px 12px'}}>
                            <span style={{padding:'3px 9px',borderRadius:20,background:`${rc}18`,border:`1px solid ${rc}40`,fontSize:11,fontWeight:700,color:rc}}>{row.risk_level}</span>
                          </td>
                          <td style={{padding:'10px 12px',color:'rgba(255,255,255,0.55)',lineHeight:1.5}}>{row.assessment}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── STRENGTHS + RISK FACTORS ── */}
          {(strengths.length>0||risks.length>0)&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
              {strengths.length>0&&(
                <div style={{...card}}>
                  <h2 style={{fontSize:14,fontWeight:700,color:'#4ade80',letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:14,display:'flex',alignItems:'center',gap:7}}>
                    <TrendingUp size={15}/>Identified Strengths
                  </h2>
                  {strengths.map((s,i)=>(
                    <div key={i} style={{marginBottom:14,paddingBottom:14,borderBottom:i<strengths.length-1?`1px solid rgba(255,255,255,0.05)`:'none'}}>
                      <div style={{fontWeight:600,color:'white',fontSize:13,marginBottom:4}}>{s.title}</div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,0.55)',lineHeight:1.7}}>{s.description}</div>
                    </div>
                  ))}
                </div>
              )}
              {risks.length>0&&(
                <div style={{background:CARD,border:'1px solid rgba(248,113,113,0.2)',borderRadius:12,padding:24}}>
                  <h2 style={{fontSize:14,fontWeight:700,color:'#f87171',letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:14,display:'flex',alignItems:'center',gap:7}}>
                    <AlertTriangle size={15}/>Reputation Risk Factors
                  </h2>
                  {risks.map((r,i)=>(
                    <div key={i} style={{marginBottom:14,paddingBottom:14,borderBottom:i<risks.length-1?`1px solid rgba(255,255,255,0.05)`:'none'}}>
                      <div style={{fontWeight:600,color:'#fca5a5',fontSize:13,marginBottom:4}}>{r.title}</div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,0.55)',lineHeight:1.7}}>{r.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CHARTS ROW ── */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
            <div style={card}>
              <h3 style={{fontSize:13,fontWeight:600,color:GOLD,marginBottom:18,letterSpacing:'0.05em'}}>LSI RADAR</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)"/>
                  <PolarAngleAxis dataKey="subject" tick={{fill:'rgba(255,255,255,0.5)',fontSize:11}}/>
                  <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/>
                  <Radar dataKey="score" stroke={GOLD} fill={GOLD} fillOpacity={0.2} strokeWidth={2}/>
                  <Radar dataKey="target" stroke="rgba(255,255,255,0.2)" fill="transparent" strokeDasharray="3 2" strokeWidth={1}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{fontSize:13,fontWeight:600,color:GOLD,marginBottom:18,letterSpacing:'0.05em'}}>GAP ANALYSIS (PARETO)</h3>
              {gapData.every(d=>d.gap===0)?(
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'#4ade80',flexDirection:'column',gap:8}}>
                  <CheckCircle size={32}/><span style={{fontSize:13,fontWeight:600}}>All on target</span>
                </div>
              ):(
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={gapData} layout="vertical" margin={{left:95,right:12}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                    <XAxis type="number" tick={{fill:'rgba(255,255,255,0.4)',fontSize:11}} axisLine={false}/>
                    <YAxis dataKey="name" type="category" tick={{fill:'rgba(255,255,255,0.5)',fontSize:11}} axisLine={false} width={95}/>
                    <Tooltip contentStyle={{background:'#1a1f2e',border:`1px solid ${BORDER}`,borderRadius:8}} formatter={(v:unknown)=>[`${(v as number).toFixed(1)} pts`,'Gap']}/>
                    <Bar dataKey="gap" radius={[0,4,4,0]}>{gapData.map((e,i)=><Cell key={i} fill={e.color} fillOpacity={0.8}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── LSI TREND ── */}
          {history.length>1&&(
            <div style={{...card,marginBottom:20}}>
              <h3 style={{fontSize:13,fontWeight:600,color:GOLD,marginBottom:18,letterSpacing:'0.05em'}}>LSI TREND</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                  <XAxis dataKey="date" tickFormatter={d=>new Date(d).toLocaleDateString('en-IN',{month:'short',year:'2-digit'})} tick={{fill:'rgba(255,255,255,0.4)',fontSize:11}} axisLine={false}/>
                  <YAxis domain={[0,100]} tick={{fill:'rgba(255,255,255,0.4)',fontSize:11}} axisLine={false}/>
                  <Tooltip contentStyle={{background:'#1a1f2e',border:`1px solid ${BORDER}`,borderRadius:8}} formatter={(v:unknown)=>[`${(v as number).toFixed(1)}`,'LSI']}/>
                  <ReferenceLine y={75} stroke={GOLD} strokeDasharray="4 2"/>
                  <Line type="monotone" dataKey="score" stroke={GOLD} strokeWidth={2} dot={{fill:GOLD,r:4}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── FRAME + KEYWORDS ── */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
            {frameData.length>0&&(
              <div style={card}>
                <h3 style={{fontSize:13,fontWeight:600,color:GOLD,marginBottom:4,letterSpacing:'0.05em'}}>LINGUISTIC FRAME DISTRIBUTION</h3>
                <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:14,lineHeight:1.5}}>
                  How media and online sources frame you. Expert + Leader frames signal authority. Family frame can dilute professional positioning. Crisis frame requires immediate attention.
                </p>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={frameData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                    <XAxis dataKey="name" tick={{fill:'rgba(255,255,255,0.5)',fontSize:11}} axisLine={false}/>
                    <YAxis unit="%" tick={{fill:'rgba(255,255,255,0.4)',fontSize:11}} axisLine={false}/>
                    <Tooltip contentStyle={{background:'#1a1f2e',border:`1px solid ${BORDER}`,borderRadius:8}} formatter={(v:unknown)=>[`${v as number}%`,'Frame %']}/>
                    <Bar dataKey="value" fill={GOLD} fillOpacity={0.7} radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {keywords.length>0&&(
                <div style={card}>
                  <h3 style={{fontSize:12,fontWeight:600,color:GOLD,marginBottom:8,letterSpacing:'0.05em'}}>TOP KEYWORDS</h3>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:10}}>Words most associated with your name across all 62 sources.</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {keywords.slice(0,10).map((kw,i)=>(
                      <span key={i} style={{padding:'3px 9px',borderRadius:20,background:'rgba(201,168,76,0.1)',border:`1px solid ${BORDER}`,fontSize:11,color:GOLD}}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {arcHints.length>0&&(
                <div style={card}>
                  <h3 style={{fontSize:12,fontWeight:600,color:GOLD,marginBottom:8,letterSpacing:'0.05em'}}>ARCHETYPE SIGNALS</h3>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:10}}>AI detected these archetype patterns from your scan data. Confirmed in Position module.</p>
                  {arcHints.map((h,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                      <div style={{width:5,height:5,borderRadius:'50%',background:GOLD,flexShrink:0}}/>
                      <span style={{fontSize:12,color:'rgba(255,255,255,0.7)'}}>{h}</span>
                    </div>
                  ))}
                </div>
              )}
              {crisisSigs.length>0&&(
                <div style={{background:'rgba(248,113,113,0.05)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:12,padding:18}}>
                  <h3 style={{fontSize:12,fontWeight:600,color:'#f87171',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><AlertTriangle size={13}/> CRISIS SIGNALS</h3>
                  {crisisSigs.map((s,i)=><div key={i} style={{fontSize:12,color:'#fca5a5',marginBottom:4,lineHeight:1.5}}>{s}</div>)}
                </div>
              )}
            </div>
          </div>

          {/* ── AI REPUTATION NARRATIVE ── */}
          {summary&&(
            <div style={{...card,marginBottom:20}}>
              <h3 style={{fontSize:13,fontWeight:600,color:GOLD,marginBottom:14,letterSpacing:'0.05em'}}>AI REPUTATION NARRATIVE</h3>
              <p style={{fontSize:14,color:'rgba(255,255,255,0.7)',lineHeight:1.8}}>{summary}</p>
            </div>
          )}

          {/* ── INTERVENTION TIMELINE ── */}
          {interventions&&(
            <div style={{...card,marginBottom:20}}>
              <h2 style={{fontSize:14,fontWeight:700,color:GOLD,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:18}}>SRE Intervention Roadmap</h2>
              {[
                {label:'Immediate (0–3 Months)', items:interventions.immediate, color:'#f87171'},
                {label:'Medium Term (3–9 Months)', items:interventions.medium_term, color:GOLD},
                {label:'Long Term (9–12 Months)', items:interventions.long_term, color:'#60a5fa'},
              ].map(({label,items,color})=>(
                <div key={label} style={{marginBottom:20}}>
                  <div style={{fontSize:12,fontWeight:700,color,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10,display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:color}}/>{label}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
                    {items?.map((item,i)=>(
                      <div key={i} style={{background:'rgba(255,255,255,0.03)',border:`1px solid rgba(255,255,255,0.07)`,borderRadius:8,padding:'12px 14px'}}>
                        <div style={{fontWeight:600,color:'white',fontSize:13,marginBottom:5}}>{item.action}</div>
                        <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:8}}>{item.detail}</div>
                        <div style={{fontSize:11,color,display:'flex',alignItems:'center',gap:5}}>
                          <TrendingUp size={11}/>{item.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PEER COMPARISON ── */}
          {peers.length>0&&(
            <div style={{...card,marginBottom:20}}>
              <h2 style={{fontSize:14,fontWeight:700,color:GOLD,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:16}}>Peer Comparison Matrix</h2>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${BORDER}`}}>
                      {['Leader','Primary Narrative','LSI Est.','India Presence','Personal Story'].map(h=>(
                        <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {peers.map((p,i)=>{
                      const isClient = i===peers.length-1;
                      const lsiColor = (p.lsi_estimate??0)<total?'#4ade80':(p.lsi_estimate??0)>total?'#f87171':GOLD;
                      const presColor = (v:string)=>v==='High'?'#4ade80':v==='Moderate'?GOLD:'#f87171';
                      return (
                        <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`,background:isClient?`rgba(201,168,76,0.04)`:'transparent'}}>
                          <td style={{padding:'10px 12px'}}>
                            <div style={{fontWeight:600,color:isClient?GOLD:'white'}}>{p.name} {isClient&&'(You)'}</div>
                            <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>{p.company}</div>
                          </td>
                          <td style={{padding:'10px 12px',color:'rgba(255,255,255,0.55)',fontSize:12}}>{p.primary_narrative}</td>
                          <td style={{padding:'10px 12px'}}>
                            <span style={{fontWeight:700,color:isClient?GOLD:lsiColor}}>{p.lsi_estimate??'—'}</span>
                          </td>
                          <td style={{padding:'10px 12px'}}><span style={{fontSize:12,color:presColor(p.india_presence)}}>{p.india_presence}</span></td>
                          <td style={{padding:'10px 12px'}}><span style={{fontSize:12,color:presColor(p.personal_story)}}>{p.personal_story}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:12,fontStyle:'italic'}}>LSI estimates are AI-generated approximations based on publicly available reputation signals. Not audited scores.</p>
            </div>
          )}

          {/* ── 12-MONTH TARGET STATE ── */}
          {targetState&&(
            <div style={{...card,marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                <h2 style={{fontSize:14,fontWeight:700,color:GOLD,letterSpacing:'0.05em',textTransform:'uppercase'}}>12-Month Target State</h2>
                <div style={{padding:'4px 12px',borderRadius:20,background:`rgba(201,168,76,0.1)`,border:`1px solid ${BORDER}`,fontSize:12,color:GOLD}}>
                  Target LSI: {targetState.target_lsi}/100
                </div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${BORDER}`}}>
                      {['Metric','Current','Target (12 Mo)','Delta'].map(h=>(
                        <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {targetState.metrics?.map((m,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                        <td style={{padding:'10px 12px',fontWeight:600,color:'white'}}>{m.metric}</td>
                        <td style={{padding:'10px 12px',color:'rgba(255,255,255,0.45)'}}>{m.current}</td>
                        <td style={{padding:'10px 12px',color:'white',fontWeight:600}}>{m.target}</td>
                        <td style={{padding:'10px 12px'}}>
                          <span style={{color:'#4ade80',fontWeight:700,fontSize:12}}>{m.delta}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SIX SIGMA STATS ── */}
          {Object.keys(stats).length>0&&(
            <div style={{...card,marginBottom:20}}>
              <h3 style={{fontSize:13,fontWeight:600,color:GOLD,marginBottom:6,letterSpacing:'0.05em'}}>SIX SIGMA BASELINE</h3>
              <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:16,lineHeight:1.5}}>Statistical control limits based on historical scores. UCL/LCL define the normal range — scores outside indicate significant change.</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
                {[
                  {l:'Mean Score',    v:stats.mean?.toFixed(1),   u:'/100'},
                  {l:'Std Deviation', v:stats.stddev?.toFixed(2), u:'σ'},
                  {l:'UCL',           v:stats.ucl?.toFixed(1),    u:'/100'},
                  {l:'LCL',           v:stats.lcl?.toFixed(1),    u:'/100'},
                ].map(({l,v,u})=>(
                  <div key={l} style={{textAlign:'center'}}>
                    <div style={{fontSize:22,fontWeight:700,color:GOLD}}>{v??'—'}<span style={{fontSize:12,color:'rgba(255,255,255,0.3)',marginLeft:2}}>{u}</span></div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:3}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CTA ── */}
          <div style={{background:'linear-gradient(135deg,rgba(201,168,76,0.1) 0%,rgba(13,17,23,0.5) 100%)',border:`1px solid ${BORDER}`,borderRadius:12,padding:22,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
            <div>
              <h3 style={{fontSize:15,fontWeight:700,color:'white',marginBottom:4}}>Ready to run Archetype Analysis?</h3>
              <p style={{fontSize:13,color:'rgba(255,255,255,0.4)'}}>Position module uses this LSI data to assign your archetype and build a full content strategy.</p>
            </div>
            <button onClick={()=>router.push(`/dashboard/clients/${clientId}/position`)} style={{padding:'11px 22px',borderRadius:8,background:GOLD,color:BG,fontWeight:700,fontSize:13,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:7,whiteSpace:'nowrap'}}>
              Go to Position <ArrowRight size={15}/>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
