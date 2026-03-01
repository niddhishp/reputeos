// app/dashboard/clients/[id]/discover/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Search, RefreshCw, CheckCircle2, Circle, Loader2,
  Globe, Newspaper, MessageSquare, Briefcase, Mic, FileText,
  AlertCircle, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase/client';

type ScanStatus = 'not_started' | 'running' | 'completed' | 'failed';

interface DiscoverRun {
  id: string;
  status: ScanStatus;
  progress: number;
  total_mentions: number;
  sentiment_summary: { positive: number; neutral: number; negative: number; average?: number } | null;
  frame_distribution: Record<string, number> | null;
  top_keywords: string[] | null;
  archetype_hints: string[] | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

const GOLD = '#C9A84C';
const CARD_BG = '#0d1117';
const BORDER = 'rgba(255,255,255,0.07)';

const SOURCE_CATEGORIES = [
  { name: 'Search Engines & AI',    sourceCount: 15, icon: Globe },
  { name: 'Media & News',           sourceCount: 10, icon: Newspaper },
  { name: 'Social Media',           sourceCount: 8,  icon: MessageSquare },
  { name: 'Professional Databases', sourceCount: 7,  icon: Briefcase },
  { name: 'Conferences & Events',   sourceCount: 5,  icon: Mic },
  { name: 'Regulatory Filings',     sourceCount: 5,  icon: FileText },
];

const FRAME_COLORS: Record<string, string> = {
  expert:  '#3b82f6',
  founder: '#8b5cf6',
  leader:  '#10b981',
  family:  GOLD,
  crisis:  '#ef4444',
  other:   'rgba(255,255,255,0.2)',
};

export default function DiscoverPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const [run, setRun] = useState<DiscoverRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'frames' | 'sentiment' | 'keywords'>('frames');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchLatestRun().finally(() => setLoading(false));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [clientId]);

  useEffect(() => {
    if (run?.status === 'running') {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchLatestRun, 2500);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, [run?.status]);

  async function fetchLatestRun() {
    const { data } = await supabase
      .from('discover_runs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setRun(data as DiscoverRun);
    return data;
  }

  async function startScan() {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/discover/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? json.error ?? `HTTP ${res.status}`);
      await fetchLatestRun();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start scan. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  const scanStatus: ScanStatus = run?.status ?? 'not_started';
  const isScanning = scanStatus === 'running';
  const progress = run?.progress ?? 0;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[200, 400, 300].map((w, i) => (
          <div key={i} style={{ height: i === 0 ? 40 : i === 1 ? 160 : 260, backgroundColor: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, maxWidth: w === 200 ? 200 : '100%', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.3px' }}>
            Discover
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
            Digital footprint audit across 50+ sources
          </p>
        </div>
        {!isScanning && (
          <button onClick={startScan} disabled={starting} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: starting ? 'not-allowed' : 'pointer',
            backgroundColor: run ? 'transparent' : GOLD,
            color: run ? 'rgba(255,255,255,0.6)' : '#080C14',
            border: run ? '1px solid rgba(255,255,255,0.12)' : 'none',
            opacity: starting ? 0.6 : 1, transition: 'all 150ms',
          }}>
            {starting
              ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
              : <RefreshCw style={{ width: 14, height: 14 }} />}
            {starting ? 'Starting…' : run ? 'Re-scan' : 'Run Discovery Scan'}
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 16px', backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
        }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f87171', margin: 0 }}>Scan failed to start</p>
            <p style={{ fontSize: 12, color: 'rgba(239,68,68,0.6)', marginTop: 3 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Scanning progress */}
      {isScanning && (
        <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Loader2 style={{ width: 18, height: 18, color: GOLD, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>Scanning in progress…</span>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: GOLD }}>{progress}%</span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: GOLD, borderRadius: 4, transition: 'width 500ms ease' }} />
          </div>
          {/* Source categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SOURCE_CATEGORIES.map((cat, i) => {
              const threshold = ((i + 1) / SOURCE_CATEGORIES.length) * 100;
              const prevThreshold = (i / SOURCE_CATEGORIES.length) * 100;
              const done = progress >= threshold;
              const active = !done && progress > prevThreshold;
              const Icon = cat.icon;
              return (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 18, height: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done
                      ? <CheckCircle2 style={{ width: 16, height: 16, color: '#10b981' }} />
                      : active
                      ? <Loader2 style={{ width: 15, height: 15, color: GOLD, animation: 'spin 1s linear infinite' }} />
                      : <Circle style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.15)' }} />}
                  </div>
                  <Icon style={{ width: 14, height: 14, color: done ? '#10b981' : active ? GOLD : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: done ? 'rgba(255,255,255,0.7)' : active ? 'white' : 'rgba(255,255,255,0.25)', flex: 1 }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>{cat.sourceCount} sources</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Failed state */}
      {scanStatus === 'failed' && run && (
        <div style={{
          backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: 14, padding: 28, textAlign: 'center',
        }}>
          <AlertCircle style={{ width: 36, height: 36, color: '#ef4444', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f87171', marginBottom: 6 }}>Scan failed</p>
          <p style={{ fontSize: 13, color: 'rgba(239,68,68,0.5)', marginBottom: 20 }}>
            {run.error_message ?? 'Unknown error. Check your API keys in Vercel.'}
          </p>
          <button onClick={startScan} disabled={starting} style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          }}>
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {scanStatus === 'completed' && run && (
        <>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Mentions', value: run.total_mentions?.toString() ?? '0', color: 'white', icon: null },
              { label: 'Positive', value: `${run.sentiment_summary?.positive ?? 0}`, color: '#10b981', icon: TrendingUp },
              { label: 'Neutral',  value: `${run.sentiment_summary?.neutral ?? 0}`,  color: 'rgba(255,255,255,0.4)', icon: Minus },
              { label: 'Negative', value: `${run.sentiment_summary?.negative ?? 0}`, color: '#ef4444', icon: TrendingDown },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
                  {Icon && <Icon style={{ width: 14, height: 14, color }} />}
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color, margin: 0 }}>{value}</p>
                {label !== 'Total Mentions' && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '4px 0 0' }}>mentions</p>}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, padding: '0 20px' }}>
              {(['frames', 'sentiment', 'keywords'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '14px 16px', fontSize: 13, fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: activeTab === tab ? GOLD : 'rgba(255,255,255,0.3)',
                  borderBottom: activeTab === tab ? `2px solid ${GOLD}` : '2px solid transparent',
                  marginBottom: -1, textTransform: 'capitalize', transition: 'color 150ms',
                }}>
                  {tab === 'frames' ? 'Frame Distribution' : tab === 'sentiment' ? 'Sentiment' : 'Keywords'}
                </button>
              ))}
            </div>

            <div style={{ padding: 24 }}>
              {/* Frame Distribution */}
              {activeTab === 'frames' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>
                    How you are positioned across online sources
                  </p>
                  {Object.entries(run.frame_distribution ?? {}).map(([frame, count]) => {
                    const total = Object.values(run.frame_distribution ?? {}).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    const color = FRAME_COLORS[frame] ?? 'rgba(255,255,255,0.3)';
                    return (
                      <div key={frame}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize', fontWeight: 500 }}>{frame}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
                        </div>
                        <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 6, transition: 'width 800ms ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sentiment */}
              {activeTab === 'sentiment' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { key: 'positive', label: 'Positive', color: '#10b981' },
                    { key: 'neutral',  label: 'Neutral',  color: 'rgba(255,255,255,0.35)' },
                    { key: 'negative', label: 'Negative', color: '#ef4444' },
                  ].map(({ key, label, color }) => {
                    const val = run.sentiment_summary?.[key as keyof typeof run.sentiment_summary] as number ?? 0;
                    return (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color }}>{val}%</span>
                        </div>
                        <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${val}%`, backgroundColor: color, borderRadius: 6, transition: 'width 800ms ease' }} />
                        </div>
                      </div>
                    );
                  })}
                  {run.sentiment_summary?.average !== undefined && (
                    <div style={{ marginTop: 8, padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Average Sentiment Score</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: (run.sentiment_summary.average ?? 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        {(run.sentiment_summary.average ?? 0) >= 0 ? '+' : ''}{run.sentiment_summary.average?.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Keywords */}
              {activeTab === 'keywords' && (
                <div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Top keywords associated with your profile</p>
                  {run.top_keywords && run.top_keywords.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {run.top_keywords.map((kw, i) => (
                        <span key={kw} style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                          backgroundColor: i < 3 ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${i < 3 ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.07)'}`,
                          color: i < 3 ? GOLD : 'rgba(255,255,255,0.5)',
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>No keyword data available.</p>
                  )}

                  {run.archetype_hints && run.archetype_hints.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                        Archetype signals detected
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {run.archetype_hints.map(hint => (
                          <span key={hint} style={{
                            padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                            backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                            color: '#a78bfa',
                          }}>
                            {hint}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', textAlign: 'right' }}>
            Last scanned {formatDistanceToNow(new Date(run.completed_at ?? run.created_at), { addSuffix: true })}
          </p>
        </>
      )}

      {/* Not started */}
      {scanStatus === 'not_started' && !starting && (
        <div style={{
          backgroundColor: CARD_BG, border: `1px dashed rgba(255,255,255,0.1)`,
          borderRadius: 14, padding: '64px 32px', textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
            backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Search style={{ width: 28, height: 28, color: GOLD }} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 10 }}>No scans run yet</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', maxWidth: 360, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Run a discovery scan to audit this profile's digital footprint across 50+ sources. Takes 2–5 minutes.
          </p>
          <button onClick={startScan} disabled={starting} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            backgroundColor: GOLD, color: '#080C14', border: 'none',
            cursor: starting ? 'not-allowed' : 'pointer', opacity: starting ? 0.6 : 1,
          }}>
            <Search style={{ width: 15, height: 15 }} />
            Run Discovery Scan
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:.3 } 50% { opacity:.6 } }
      `}</style>
    </div>
  );
}
