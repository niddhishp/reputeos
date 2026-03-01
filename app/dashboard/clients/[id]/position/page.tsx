'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Sparkles, RefreshCw, AlertTriangle, Lock, ArrowRight,
  CheckCircle, Copy, Target, Users, Zap, BarChart3, BookOpen,
  ChevronDown, ChevronUp, Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Positioning {
  id: string;
  client_id: string;
  mode: string;
  personal_archetype: string;
  business_archetype?: string;
  archetype_confidence: number;
  followability_score: number;
  followability_factors: Record<string, number>;
  positioning_statement: string;
  content_pillars: Array<{
    name: string; themes: string[]; frequency: string; formats: string[];
  }>;
  signature_lines: string[];
  target_influencers: Array<{ name: string; archetype: string; platforms: string[]; strategy: string }>;
  root_cause_insights?: string[];
  strategic_insights?: string[];
  updated_at: string;
}

interface Client {
  name: string; industry: string; role: string; company: string; baseline_lsi: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FactorBar({ label, value }: { label: string; value: number }) {
  const colors: Record<string, string> = {
    uniqueness: '#818cf8', emotionalResonance: '#f472b6',
    contentOpportunity: '#34d399', platformFit: '#60a5fa', historicalPerformance: '#fb923c',
  };
  const color = colors[label] || GOLD;
  const nice  = label.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{nice}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function PillarCard({ pillar, i }: { pillar: Positioning['content_pillars'][0]; i: number }) {
  const [open, setOpen] = useState(i === 0);
  const colors = ['#818cf8', '#34d399', '#60a5fa', '#f472b6', '#fb923c'];
  const color  = colors[i % colors.length];
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{pillar.name}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', border: `1px solid ${BORDER}`, padding: '2px 8px', borderRadius: 12 }}>{pillar.frequency}</span>
        </div>
        {open ? <ChevronUp size={14} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.4)" />}
      </button>
      {open && (
        <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ marginTop: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Themes</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {pillar.themes.map((t, j) => (
                <span key={j} style={{ padding: '3px 9px', borderRadius: 16, background: `${color}15`, border: `1px solid ${color}30`, fontSize: 12, color }}>{t}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Formats</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {pillar.formats.map((f, j) => (
                <span key={j} style={{ padding: '3px 9px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, color: copied ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
      {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
    </button>
  );
}

// ─── Run AI Analysis Panel ────────────────────────────────────────────────────

function RunAnalysisPanel({ clientId, hasDiscover, hasLSI, onComplete }: {
  clientId: string; hasDiscover: boolean; hasLSI: boolean; onComplete: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [error,   setError]   = useState('');
  const [step,    setStep]    = useState('');

  async function runAnalysis() {
    if (!hasDiscover) return;
    setRunning(true); setError(''); setStep('');

    try {
      // Step 1: LSI if not done
      if (!hasLSI) {
        setStep('Calculating LSI from scan data…');
        const lsiRes = await fetch('/api/lsi/calculate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId }),
        });
        if (!lsiRes.ok) { const d = await lsiRes.json(); throw new Error(d.message || 'LSI failed'); }
      }

      // Step 2: Archetype assignment
      setStep('Running AI archetype analysis…');
      const arcRes = await fetch('/api/archetype/assign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      if (!arcRes.ok) { const d = await arcRes.json(); throw new Error(d.message || 'Archetype analysis failed'); }

      setStep('Saving positioning strategy…');
      await new Promise(r => setTimeout(r, 800));
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setRunning(false); setStep('');
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 520, margin: '0 auto' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {!hasDiscover ? (
        <>
          <Sparkles size={44} color={GOLD} style={{ margin: '0 auto 20px', display: 'block', opacity: 0.5 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>Run Discovery First</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            Position uses your 62-source scan data to assign your archetype. Complete Discovery first.
          </p>
          <a href="discover" style={{ padding: '12px 26px', borderRadius: 8, background: GOLD, color: '#080C14', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
            Go to Discover →
          </a>
        </>
      ) : (
        <>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${GOLD}15`, border: `2px solid ${GOLD}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Sparkles size={28} color={GOLD} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 10 }}>Archetype Analysis</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 8, lineHeight: 1.7 }}>
            AI will analyse your 62-source scan data to assign your optimal Jungian character archetype, business archetype, followability score, 5 content pillars, and strategic insights.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 32 }}>
            ~30–45 seconds · Uses GPT-4o
          </p>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {running && step && (
            <div style={{ color: GOLD, fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', animation: 'pulse 1.5s ease-in-out infinite' }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> {step}
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={running}
            style={{
              padding: '14px 32px', borderRadius: 8,
              background: running ? 'rgba(201,168,76,0.4)' : GOLD,
              color: '#080C14', fontWeight: 700, fontSize: 15, border: 'none',
              cursor: running ? 'wait' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {running
              ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</>
              : <><Sparkles size={16} /> Run AI Analysis</>}
          </button>

          <div style={{ marginTop: 32, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Jungian Archetype', 'Business Archetype', 'Followability Score', '5 Content Pillars', 'Signature Lines', 'Strategic Insights'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD }} /> {item}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Positioning Display ──────────────────────────────────────────────────────

function PositioningDisplay({ pos, clientId, onRerun }: {
  pos: Positioning; clientId: string; onRerun: () => void;
}) {
  const router  = useRouter();
  const factors = pos.followability_factors ?? {};
  const fl      = pos.followability_score ?? 0;
  const flColor = fl >= 80 ? '#4ade80' : fl >= 65 ? GOLD : '#fb923c';
  const flLabel = fl >= 80 ? 'Exceptional' : fl >= 65 ? 'Strong' : 'Moderate';

  const insights: string[]    = pos.strategic_insights ?? [];
  const rootCause: string[]   = pos.root_cause_insights ?? [];

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Lock size={14} color="#4ade80" />
            <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>STRATEGIC LOCK ACTIVE</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>Position</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
            Archetype · Followability · Content Strategy · Insights
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onRerun} style={{
            padding: '9px 16px', borderRadius: 8, border: `1px solid ${BORDER}`,
            background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <RefreshCw size={13} /> Re-run Analysis
          </button>
          <button onClick={() => router.push(`/dashboard/clients/${clientId}/express`)} style={{
            padding: '9px 18px', borderRadius: 8, background: GOLD,
            color: '#080C14', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Create Content <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Archetype hero */}
      <div style={{
        background: `linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(13,17,23,0.9) 100%)`,
        border: `1px solid ${BORDER}`, borderRadius: 14, padding: '28px 32px', marginBottom: 20,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 24, alignItems: 'start',
      }}>
        {/* Personal archetype */}
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Character Archetype</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: GOLD, marginBottom: 6 }}>
            {pos.personal_archetype}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', border: `1px solid ${BORDER}`, display: 'inline-block', padding: '2px 8px', borderRadius: 10 }}>
            {pos.mode === 'personal_only' ? 'Personal Only' : 'Personal'}
          </div>
        </div>

        <div style={{ width: 1, height: 60, background: BORDER, alignSelf: 'center' }} />

        {/* Business archetype */}
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Business Archetype</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>
            {pos.business_archetype || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', fontSize: 14 }}>Personal only</span>}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            Confidence: {pos.archetype_confidence}%
          </div>
        </div>

        <div style={{ width: 1, height: 60, background: BORDER, alignSelf: 'center' }} />

        {/* Followability */}
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Followability Score</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: flColor, lineHeight: 1 }}>{fl}%</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: flColor, marginTop: 4 }}>{flLabel}</div>
        </div>
      </div>

      {/* Positioning statement */}
      {pos.positioning_statement && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Positioning Statement</div>
            <p style={{ fontSize: 15, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>"{pos.positioning_statement}"</p>
          </div>
          <CopyButton text={pos.positioning_statement} />
        </div>
      )}

      {/* Followability factors + signature lines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Followability Factors</h3>
          {Object.entries(factors).map(([k, v]) => <FactorBar key={k} label={k} value={typeof v === 'number' ? v : 0} />)}
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signature Lines</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(pos.signature_lines ?? []).map((line, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${BORDER}` }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', flex: 1, lineHeight: 1.5 }}>{line}</span>
                <CopyButton text={line} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content pillars */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 22, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content Pillars</h3>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{(pos.content_pillars ?? []).length} pillars defined</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(pos.content_pillars ?? []).map((p, i) => <PillarCard key={i} pillar={p} i={i} />)}
        </div>
      </div>

      {/* Strategic insights */}
      {insights.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 22, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={14} /> Strategic Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: `${GOLD}08`, border: `1px solid ${GOLD}25`, borderRadius: 8 }}>
                <div style={{ minWidth: 22, height: 22, borderRadius: '50%', background: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Root cause insights */}
      {rootCause.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 22, marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fb923c', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={14} /> Root Cause Analysis
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rootCause.map((rc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 8 }}>
                <AlertTriangle size={13} color="#fb923c" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{rc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target influencers */}
      {(pos.target_influencers ?? []).length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 22, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={14} /> Target Influencers
            </h3>
            <button
              onClick={() => router.push(`/dashboard/clients/${clientId}/position/influencers`)}
              style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}
            >
              Analyse DNA →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {pos.target_influencers.map((inf, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>{inf.name}</div>
                <div style={{ fontSize: 11, color: GOLD, marginBottom: 6, textTransform: 'capitalize' }}>{inf.archetype}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                  {(inf.platforms ?? []).map((pl, j) => (
                    <span key={j} style={{ padding: '2px 7px', borderRadius: 10, background: `${GOLD}10`, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{pl}</span>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{inf.strategy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA to Express */}
      <div style={{
        background: `linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(13,17,23,0.5) 100%)`,
        border: `1px solid ${BORDER}`, borderRadius: 12, padding: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 4 }}>Start Creating Content</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Express module generates archetype-aligned content using this positioning as the strategic foundation.</p>
        </div>
        <button onClick={() => router.push(`/dashboard/clients/${clientId}/express`)} style={{
          padding: '11px 22px', borderRadius: 8, background: GOLD, color: '#080C14',
          fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
        }}>
          Go to Express <ArrowRight size={15} />
        </button>
      </div>

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16, textAlign: 'right' }}>
        Last analysed {new Date(pos.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PositionPage() {
  const params   = useParams();
  const clientId = params.id as string;

  const [pos,         setPos]         = useState<Positioning | null>(null);
  const [client,      setClient]      = useState<Client | null>(null);
  const [hasDiscover, setHasDiscover] = useState(false);
  const [hasLSI,      setHasLSI]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [forceRerun,  setForceRerun]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: cl }, { data: dr }, { data: lsi }, { data: positioning }] = await Promise.all([
      supabase.from('clients').select('name,industry,role,company,baseline_lsi').eq('id', clientId).single(),
      supabase.from('discover_runs').select('id').eq('client_id', clientId).eq('status', 'completed').limit(1).maybeSingle(),
      supabase.from('lsi_runs').select('id').eq('client_id', clientId).limit(1).maybeSingle(),
      supabase.from('positioning').select('*').eq('client_id', clientId).maybeSingle(),
    ]);
    setClient(cl as Client ?? null);
    setHasDiscover(!!dr);
    setHasLSI(!!lsi);
    setPos(positioning as Positioning ?? null);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} /> Loading…
      </div>
    );
  }

  const showAnalysis = !pos || forceRerun;

  return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>
      {showAnalysis ? (
        <RunAnalysisPanel
          clientId={clientId}
          hasDiscover={hasDiscover}
          hasLSI={hasLSI}
          onComplete={() => { setForceRerun(false); load(); }}
        />
      ) : (
        <PositioningDisplay
          pos={pos!}
          clientId={clientId}
          onRerun={() => setForceRerun(true)}
        />
      )}
    </div>
  );
}
