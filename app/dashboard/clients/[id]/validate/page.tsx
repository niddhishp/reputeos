'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  BarChart, Bar, Cell, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, RefreshCw, FileText, AlertTriangle,
  CheckCircle, Activity, ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';

// ─── Stats helpers ────────────────────────────────────────────────────────────

function mean(arr: number[]) { return arr.reduce((s, x) => s + x, 0) / (arr.length || 1); }
function stddev(arr: number[]) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + Math.pow(x - m, 2), 0) / Math.max(arr.length - 1, 1));
}
// Welch's one-sample t-test p-value approximation
function pValue(baseline: number, current: number, n: number): number {
  if (n < 2) return 1;
  const diff = Math.abs(current - baseline);
  const se   = diff / Math.sqrt(n);
  const t    = diff / (se || 0.001);
  // approximation: p ≈ 2 / (1 + exp(0.717 * t + 0.416 * t^2)) for df > 5
  return Math.min(2 / (1 + Math.exp(0.717 * t + 0.416 * t * t)), 1);
}
function cohensD(baseline: number, current: number, sd: number): number {
  return sd > 0 ? Math.abs(current - baseline) / sd : 0;
}
function effectLabel(d: number): { label: string; color: string } {
  if (d >= 0.8) return { label: 'Large effect', color: '#4ade80' };
  if (d >= 0.5) return { label: 'Medium effect', color: GOLD };
  if (d >= 0.2) return { label: 'Small effect', color: '#60a5fa' };
  return { label: 'Negligible', color: '#6b7280' };
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Stat box ─────────────────────────────────────────────────────────────────

function StatBox({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '18px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color ?? 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {icon}{value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ValidatePage() {
  const params   = useParams();
  const router   = useRouter();
  const clientId = params.id as string;

  const [lsiHistory,     setLsiHistory]     = useState<{ date: string; score: number; components: Record<string,number> }[]>([]);
  const [baselineFrames, setBaselineFrames] = useState<Record<string,number> | null>(null);
  const [currentFrames,  setCurrentFrames]  = useState<Record<string,number> | null>(null);
  const [clientData,     setClientData]     = useState<{ name: string; baseline_lsi: number | null; target_lsi: number | null } | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [showReport,     setShowReport]     = useState(false);
  const [reportFmt,      setReportFmt]      = useState<'pdf' | 'pptx'>('pdf');
  const [generating,     setGenerating]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: cl }, { data: lsi }, { data: dr }] = await Promise.all([
      supabase.from('clients').select('name, baseline_lsi, target_lsi').eq('id', clientId).single(),
      supabase.from('lsi_runs').select('run_date, total_score, components').eq('client_id', clientId).order('run_date', { ascending: true }).limit(24),
      supabase.from('discover_runs').select('frame_dist').eq('client_id', clientId).eq('status', 'completed').order('created_at', { ascending: true }).limit(2),
    ]);
    if (cl) setClientData(cl as typeof clientData);
    if (lsi?.length) setLsiHistory(lsi.map(r => ({ date: r.run_date, score: r.total_score, components: (r.components as Record<string,number>) ?? {} })));
    if (dr && dr.length >= 2) {
      setBaselineFrames((dr[0].frame_dist as Record<string,number>) ?? null);
      setCurrentFrames((dr[dr.length - 1].frame_dist as Record<string,number>) ?? null);
    } else if (dr && dr.length === 1) {
      setBaselineFrames((dr[0].frame_dist as Record<string,number>) ?? null);
      setCurrentFrames((dr[0].frame_dist as Record<string,number>) ?? null);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/export/${reportFmt}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, reportType: 'monthly', period: 'full_engagement' }),
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${clientData?.name ?? 'ReputeOS'}_Report.${reportFmt}`; a.click();
      URL.revokeObjectURL(url);
      setShowReport(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export failed');
    } finally { setGenerating(false); }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const scores        = lsiHistory.map(r => r.score);
  const baselineLSI   = clientData?.baseline_lsi ?? scores[0] ?? 0;
  const currentLSI    = scores[scores.length - 1] ?? 0;
  const targetLSI     = clientData?.target_lsi ?? 75;
  const improvement   = Math.round(currentLSI - baselineLSI);
  const progress      = baselineLSI < targetLSI
    ? Math.min(Math.round(((currentLSI - baselineLSI) / (targetLSI - baselineLSI)) * 100), 100)
    : 100;
  const sd            = stddev(scores);
  const pv            = pValue(baselineLSI, currentLSI, scores.length);
  const cd            = cohensD(baselineLSI, currentLSI, sd);
  const effectInfo    = effectLabel(cd);

  // Component-level changes (first vs last run)
  const COMPS = ['c1','c2','c3','c4','c5','c6'];
  const COMP_NAMES: Record<string,string> = {
    c1:'Search Reputation', c2:'Media Framing', c3:'Social Backlash',
    c4:'Elite Discourse',   c5:'3rd-Party Valid.', c6:'Crisis Moat',
  };
  const COMP_COLORS = ['#818cf8','#34d399','#60a5fa','#f472b6','#fb923c','#4ade80'];
  const componentChanges = COMPS.map((id, i) => {
    const first = lsiHistory[0]?.components[id] ?? 0;
    const last  = lsiHistory[lsiHistory.length - 1]?.components[id] ?? 0;
    return { id, name: COMP_NAMES[id], first, last, change: last - first, color: COMP_COLORS[i] };
  });

  // Frame shift bar data
  const allFrameKeys = Array.from(new Set([
    ...Object.keys(baselineFrames ?? {}),
    ...Object.keys(currentFrames ?? {}),
  ])).filter(k => (baselineFrames?.[k] ?? 0) > 0 || (currentFrames?.[k] ?? 0) > 0);

  const frameShiftData = allFrameKeys.map(k => ({
    name: k[0].toUpperCase() + k.slice(1),
    baseline: baselineFrames?.[k] ?? 0,
    current:  currentFrames?.[k] ?? 0,
  }));

  const card: React.CSSProperties = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <RefreshCw size={21} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} /> Loading validation data…
    </div>
  );

  if (lsiHistory.length < 1) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <Activity size={44} color={GOLD} style={{ margin: '0 auto 20px', display: 'block', opacity: 0.5 }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>No LSI Data Yet</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, maxWidth: 380, margin: '0 auto 24px' }}>
        Run Discovery and Diagnose first, then return here to track improvement over time.
      </p>
      <button onClick={() => router.push(`/dashboard/clients/${clientId}/diagnose`)}
        style={{ padding: '11px 24px', borderRadius: 8, background: GOLD, color: '#080C14', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
        Go to Diagnose →
      </button>
    </div>
  );

  return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>Validate</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Statistical proof of LSI improvement · Before/after comparison</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push(`/dashboard/clients/${clientId}/diagnose`)}
            style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} /> Recalculate LSI
          </button>
          <button onClick={() => setShowReport(true)}
            style={{ padding: '9px 18px', borderRadius: 8, background: GOLD, color: '#080C14', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={13} /> Export Report
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatBox label="Baseline LSI" value={baselineLSI.toFixed(1)} sub="Starting point" color="rgba(255,255,255,0.4)" />
        <StatBox
          label="Current LSI" value={currentLSI.toFixed(1)}
          sub={`${improvement >= 0 ? '+' : ''}${improvement} pts`}
          color={improvement > 0 ? '#4ade80' : improvement < 0 ? '#f87171' : GOLD}
          icon={improvement > 0 ? <TrendingUp size={20} /> : improvement < 0 ? <TrendingDown size={20} /> : undefined}
        />
        <StatBox label="Target LSI" value={targetLSI} sub={`${progress}% progress`} color={GOLD} />
        <StatBox label="LSI Runs" value={lsiHistory.length} sub={`${lsiHistory.length < 2 ? 'Need 2+ for stats' : 'Statistical base'}`} color="#60a5fa" />
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>Progress to Target ({targetLSI})</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: progress >= 100 ? '#4ade80' : GOLD }}>{progress}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${progress}%`, borderRadius: 4, background: progress >= 100 ? '#4ade80' : GOLD, transition: 'width 1s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            <span>Baseline: {baselineLSI.toFixed(1)}</span>
            <span>Current: {currentLSI.toFixed(1)}</span>
            <span>Target: {targetLSI}</span>
          </div>
        </div>
      )}

      {/* LSI Trend chart */}
      {lsiHistory.length > 1 && (
        <div style={{ ...card, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LSI TREND OVER TIME</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lsiHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} />
              <YAxis domain={[Math.max(0, baselineLSI - 10), Math.min(100, targetLSI + 10)]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1f2e', border: `1px solid ${BORDER}`, borderRadius: 8 }}
                formatter={(v: unknown) => [`${(v as number).toFixed(1)}`, 'LSI']} labelFormatter={(d: unknown) => fmt(String(d))} />
              <ReferenceLine y={baselineLSI} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 2" label={{ value: 'Baseline', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <ReferenceLine y={targetLSI} stroke={GOLD} strokeDasharray="4 2" label={{ value: 'Target', fill: GOLD, fontSize: 10 }} />
              <Line type="monotone" dataKey="score" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Statistical significance */}
      {lsiHistory.length >= 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={card}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATISTICAL SIGNIFICANCE</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>T-Test p-value</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: pv < 0.05 ? '#4ade80' : GOLD }}>
                  {pv < 0.001 ? '< 0.001' : pv.toFixed(3)}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 12, background: pv < 0.05 ? 'rgba(74,222,128,0.15)' : 'rgba(251,146,60,0.15)', color: pv < 0.05 ? '#4ade80' : '#fb923c', fontSize: 12, fontWeight: 600 }}>
                  {pv < 0.05 ? '✓ Significant' : 'Not yet significant'}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.5 }}>
                {pv < 0.05 ? 'Improvement is statistically significant at 95% confidence level.' : `Need more LSI runs. Current: ${lsiHistory.length} runs. Aim for 5+.`}
              </p>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Standard Deviation</div>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{sd.toFixed(2)} σ</span>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.05em' }}>EFFECT SIZE (COHEN'S D)</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Cohen's d</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: effectInfo.color }}>{cd.toFixed(2)}</span>
                <span style={{ padding: '3px 10px', borderRadius: 12, background: `${effectInfo.color}20`, color: effectInfo.color, fontSize: 12, fontWeight: 600 }}>
                  {effectInfo.label}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.5 }}>
                Effect size measures practical significance — how meaningful the improvement is in real-world terms.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
              {[{ label: 'Small', thresh: '≥ 0.2', color: '#60a5fa' }, { label: 'Medium', thresh: '≥ 0.5', color: GOLD }, { label: 'Large', thresh: '≥ 0.8', color: '#4ade80' }].map(r => (
                <div key={r.label} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{r.thresh}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Component-level changes */}
      {lsiHistory.length >= 2 && (
        <div style={{ ...card, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>COMPONENT-LEVEL CHANGES</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {componentChanges.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 120, fontSize: 12, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{c.name}</div>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, position: 'relative', overflow: 'visible' }}>
                  {/* Baseline */}
                  <div style={{ position: 'absolute', left: 0, height: '100%', width: `${(c.first / 20) * 100}%`, background: 'rgba(255,255,255,0.15)', borderRadius: 3 }} />
                  {/* Current */}
                  <div style={{ position: 'absolute', left: 0, height: '100%', width: `${(c.last / 20) * 100}%`, background: c.color, borderRadius: 3, opacity: 0.7 }} />
                </div>
                <div style={{ width: 70, fontSize: 12, textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{c.first.toFixed(1)}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>→</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{c.last.toFixed(1)}</span>
                </div>
                <div style={{ width: 56, textAlign: 'right', fontSize: 12, fontWeight: 700, color: c.change > 0 ? '#4ade80' : c.change < 0 ? '#f87171' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                  {c.change > 0 ? `+${c.change.toFixed(1)}` : c.change.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frame shift */}
      {frameShiftData.length > 0 && (
        <div style={{ ...card, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>FRAME SHIFT ANALYSIS</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={frameShiftData} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} />
              <YAxis unit="%" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1f2e', border: `1px solid ${BORDER}`, borderRadius: 8 }}
                formatter={(v: unknown, name: unknown) => [`${v}%`, name === 'baseline' ? 'Baseline' : 'Current']} />
              <Bar dataKey="baseline" fill="rgba(255,255,255,0.15)" radius={[3,3,0,0]} name="baseline" />
              <Bar dataKey="current"  fill={GOLD}                   fillOpacity={0.75} radius={[3,3,0,0]} name="current" />
            </BarChart>
          </ResponsiveContainer>

          {baselineFrames && currentFrames && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: `${GOLD}08`, border: `1px solid ${GOLD}25`, borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, marginBottom: 6 }}>Frame Shift Summary</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {allFrameKeys.map(k => {
                  const diff = (currentFrames[k] ?? 0) - (baselineFrames[k] ?? 0);
                  return (
                    <div key={k} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      <span style={{ textTransform: 'capitalize' }}>{k}</span>: {' '}
                      <span style={{ color: diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                        {diff > 0 ? `+${diff}%` : `${diff}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next: Shield CTA */}
      <div style={{
        background: `linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(13,17,23,0.5) 100%)`,
        border: `1px solid ${BORDER}`, borderRadius: 12, padding: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 }}>Enable 24/7 Reputation Monitoring</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Shield module monitors mentions, detects crises, and tracks competitors in real-time.</p>
        </div>
        <button onClick={() => router.push(`/dashboard/clients/${clientId}/shield`)} style={{
          padding: '10px 20px', borderRadius: 8, background: GOLD, color: '#080C14',
          fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
        }}>
          Go to Shield <ArrowRight size={14} />
        </button>
      </div>

      {/* Report modal */}
      {showReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowReport(false); }}>
          <div style={{ background: '#0d1117', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32, width: '100%', maxWidth: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>Export Board Report</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
              Generate a presentation-ready report for {clientData?.name ?? 'this client'}.
            </p>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['pdf', 'pptx'] as const).map(f => (
                  <button key={f} onClick={() => setReportFmt(f)} style={{
                    flex: 1, padding: '12px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${reportFmt === f ? GOLD : BORDER}`,
                    background: reportFmt === f ? `${GOLD}15` : 'transparent',
                    color: reportFmt === f ? GOLD : 'rgba(255,255,255,0.5)',
                    fontSize: 13, fontWeight: 600, textTransform: 'uppercase',
                  }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}25`, borderRadius: 8, padding: '12px 14px', marginBottom: 24, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              Covers: LSI baseline → current, frame shift, statistical significance, component breakdown.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowReport(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={generateReport} disabled={generating} style={{
                flex: 2, padding: '11px', borderRadius: 8, background: generating ? 'rgba(201,168,76,0.4)' : GOLD,
                color: '#080C14', fontWeight: 700, fontSize: 13, border: 'none', cursor: generating ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                {generating ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><FileText size={14} /> Export {reportFmt.toUpperCase()}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
