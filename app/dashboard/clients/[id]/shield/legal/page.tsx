'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield, Scale, Database, FileSearch, AlertTriangle, Lock,
  CheckCircle, XCircle, AlertCircle, RefreshCw, ArrowRight,
  Download, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

const GOLD   = '#C9A84C';
const BG     = '#080C14';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.12)';
const MUTED  = 'rgba(255,255,255,0.35)';
const TEXT   = 'rgba(255,255,255,0.7)';

interface LegalFinding {
  category: string;
  signal: string;
  severity: 'Clear' | 'Low' | 'Moderate' | 'High' | 'Critical';
  source: string;
  url?: string;
  date?: string;
  summary: string;
}

interface CategoryResult {
  status: string;
  findings: LegalFinding[];
  score: number;
}

interface LegalScanResult {
  legal_risk_score: number;
  overall_status: 'Clean' | 'Minor Flags' | 'Material Risk' | 'Critical Exposure';
  scan_date: string;
  categories: {
    ecourts_litigation:   CategoryResult;
    sebi_regulatory:      CategoryResult;
    mca_corporate:        CategoryResult;
    nclt_insolvency:      CategoryResult;
    enforcement_actions:  CategoryResult;
    media_legal_signals:  CategoryResult;
  };
  clean_certificate: boolean;
  strategic_implications: string;
  recommended_actions: string[];
  disclaimer: string;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  ecourts_litigation:   { label: 'Courts & Litigation',     icon: Scale,         description: 'Civil suits, criminal cases, arbitration, consumer forums' },
  sebi_regulatory:      { label: 'SEBI & Regulatory',       icon: Database,      description: 'SEBI orders, RBI notices, sector regulator actions' },
  mca_corporate:        { label: 'MCA & Corporate Records', icon: FileSearch,    description: 'Director status, company filings, DIN records' },
  nclt_insolvency:      { label: 'NCLT & Insolvency',       icon: AlertTriangle, description: 'IBC filings, winding-up petitions, NCLAT appeals' },
  enforcement_actions:  { label: 'Enforcement Actions',     icon: Shield,        description: 'ED, CBI, IT department, FEMA violations' },
  media_legal_signals:  { label: 'Media Legal Signals',     icon: FileSearch,    description: 'News coverage of disputes, allegations, settlements' },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Clear:    { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
  Low:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)' },
  Moderate: { color: GOLD,      bg: 'rgba(201,168,76,0.08)',  border: 'rgba(201,168,76,0.2)' },
  High:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)' },
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  'Clean':            { color: '#10b981', label: 'Clean' },
  'Minor Flags':      { color: GOLD,      label: 'Minor Flags' },
  'Material Risk':    { color: '#f97316', label: 'Material Risk' },
  'Critical Exposure':{ color: '#ef4444', label: 'Critical Exposure' },
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? GOLD : score >= 40 ? '#f97316' : '#ef4444';
  const label = score >= 80 ? 'Clean' : score >= 60 ? 'Minor Flags' : score >= 40 ? 'Material Risk' : 'Critical';

  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={80} cy={80} r={68} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
          <circle cx={80} cy={80} r={68} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={`${2 * Math.PI * 68}`}
            strokeDashoffset={`${2 * Math.PI * 68 * (1 - score / 100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 40, fontWeight: 800, color, lineHeight: 1, fontFamily: 'monospace' }}>{score}</span>
          <span style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>/ 100</span>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color }}>{label}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Legal Risk Score</div>
    </div>
  );
}

function CategoryCard({ catKey, data }: { catKey: string; data: CategoryResult }) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[catKey];
  const Icon = meta.icon;
  const hasFindings = data.findings?.filter(f => f.severity !== 'Clear').length > 0;
  const scoreColor = data.score >= 80 ? '#10b981' : data.score >= 60 ? GOLD : '#f97316';

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', background: CARD }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 16, color: GOLD }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{meta.label}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{meta.description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor, fontFamily: 'monospace', lineHeight: 1 }}>{data.score ?? 100}</div>
            <div style={{ fontSize: 10, color: MUTED }}>score</div>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: hasFindings ? 'rgba(249,115,22,0.08)' : 'rgba(16,185,129,0.08)',
            color: hasFindings ? '#f97316' : '#10b981',
            border: `1px solid ${hasFindings ? 'rgba(249,115,22,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
            {hasFindings ? `${data.findings.filter(f => f.severity !== 'Clear').length} flag${data.findings.filter(f => f.severity !== 'Clear').length > 1 ? 's' : ''}` : 'Clear'}
          </div>
          {open ? <ChevronUp style={{ width: 14, color: MUTED }} /> : <ChevronDown style={{ width: 14, color: MUTED }} />}
        </div>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.04)`, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>{data.status}</div>
          {(data.findings ?? []).length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(16,185,129,0.05)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.1)' }}>
              <CheckCircle style={{ width: 14, color: '#10b981' }} />
              <span style={{ fontSize: 12, color: '#10b981' }}>No material findings in this category.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.findings.map((f, i) => {
                const sc = SEVERITY_CONFIG[f.severity] ?? SEVERITY_CONFIG.Low;
                return (
                  <div key={i} style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sc.color }}>{f.severity}</span>
                      {f.url && (
                        <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: MUTED, textDecoration: 'none' }}>
                          <ExternalLink style={{ width: 11 }} /> Source
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: TEXT, marginBottom: 4 }}>{f.signal}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{f.summary}</div>
                    {f.source && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Source: {f.source}{f.date ? ` · ${f.date}` : ''}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Upgrade gate ──────────────────────────────────────────────────────────────

function UpgradeGate({ clientId }: { clientId: string }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 480, textAlign: 'center', padding: '0 24px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(201,168,76,0.08)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Lock style={{ width: 28, color: GOLD }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: 12, letterSpacing: '-0.02em' }}>Shield Pro — Agency & Enterprise Only</h2>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 32 }}>
          Legal intelligence scanning across 23+ Indian legal databases — eCourts, SEBI, MCA, NCLT, Enforcement Directorate — is available on Agency and Enterprise plans.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', gap: 8, background: GOLD, color: '#080C14', fontWeight: 700, fontSize: 13, padding: '11px 22px', borderRadius: 8, textDecoration: 'none' }}>
            Upgrade Plan <ArrowRight style={{ width: 14 }} />
          </Link>
          <Link href="/shield-pro" style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid rgba(255,255,255,0.1)`, color: TEXT, fontSize: 13, padding: '11px 22px', borderRadius: 8, textDecoration: 'none' }}>
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ShieldLegalPage() {
  const { id } = useParams() as { id: string };
  const [plan, setPlan]           = useState<string | null>(null);
  const [scanning, setScanning]   = useState(false);
  const [result, setResult]       = useState<LegalScanResult | null>(null);
  const [scanId, setScanId]       = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  // Fetch plan + last scan
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: lastScan }] = await Promise.all([
        supabase.from('user_profiles').select('plan').eq('id', user.id).maybeSingle(),
        supabase.from('legal_scans').select('*').eq('client_id', id).eq('status', 'completed').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      setPlan(profile?.plan ?? 'solo');
      if (lastScan?.result) {
        setResult(lastScan.result as LegalScanResult);
        setScanId(lastScan.id);
      }
      setLoading(false);
    }
    init();
  }, [id]);

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/shield/legal-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id }),
      });
      const data = await res.json() as { result?: LegalScanResult; scanId?: string; error?: string; upgrade_url?: string };
      if (!res.ok) {
        if (res.status === 403) { setError('Upgrade required: ' + (data.error ?? '')); return; }
        throw new Error(data.error ?? 'Scan failed');
      }
      setResult(data.result ?? null);
      setScanId(data.scanId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }, [id]);

  const card: React.CSSProperties = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28 };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 24, height: 24, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!['agency', 'enterprise'].includes(plan ?? '')) {
    return <UpgradeGate clientId={id} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Shield style={{ width: 20, color: GOLD }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em' }}>Shield Pro</h1>
            <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: 'rgba(201,168,76,0.1)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '3px 8px', letterSpacing: '0.04em' }}>LEGAL INTELLIGENCE</span>
          </div>
          <p style={{ fontSize: 13, color: MUTED }}>23+ Indian legal databases — eCourts, SEBI, MCA, NCLT, Enforcement Directorate</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {result && (
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, background: 'none', color: TEXT, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Download style={{ width: 13 }} /> Export PDF
            </button>
          )}
          <button onClick={runScan} disabled={scanning} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: GOLD, color: '#080C14', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: scanning ? 'not-allowed' : 'pointer', opacity: scanning ? 0.7 : 1, fontFamily: 'inherit' }}>
            {scanning ? (
              <><div style={{ width: 14, height: 14, border: '2px solid #080C14', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Scanning…</>
            ) : (
              <><RefreshCw style={{ width: 14 }} /> {result ? 'Re-run Scan' : 'Run Legal Scan'}</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <XCircle style={{ width: 16, color: '#ef4444' }} />
          <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
        </div>
      )}

      {scanning && (
        <div style={{ ...card, padding: '40px 28px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
            {['eCourts', 'SEBI', 'MCA', 'NCLT', 'Enforcement', 'Media'].map((label, i) => (
              <div key={label} style={{ fontSize: 11, color: MUTED, padding: '5px 10px', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 6, animation: `pulse 1.5s ease infinite`, animationDelay: `${i * 0.25}s` }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Scanning legal databases…</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>This takes 30–90 seconds. Do not close this page.</div>
        </div>
      )}

      {!scanning && !result && !error && (
        <div style={{ ...card, padding: '60px 28px', textAlign: 'center' }}>
          <Shield style={{ width: 40, color: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>No legal scan run yet</h3>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>Run the first Shield Pro scan to surface legal exposure across 23+ Indian databases.</p>
          <button onClick={runScan} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: GOLD, color: '#080C14', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Shield style={{ width: 14 }} /> Run Legal Scan
          </button>
        </div>
      )}

      {result && !scanning && (
        <>
          {/* Score + Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, alignItems: 'start' }}>
            <div style={card}>
              <ScoreRing score={result.legal_risk_score} />
              {result.clean_certificate && (
                <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle style={{ width: 13, color: '#10b981' }} />
                  <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Clean Certificate Issued</span>
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 11, color: MUTED, textAlign: 'center' }}>
                Scanned {result.scan_date ? new Date(result.scan_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Overall status */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {result.overall_status === 'Clean'
                    ? <CheckCircle style={{ width: 18, color: '#10b981' }} />
                    : result.overall_status === 'Critical Exposure'
                    ? <XCircle style={{ width: 18, color: '#ef4444' }} />
                    : <AlertCircle style={{ width: 18, color: GOLD }} />
                  }
                  <span style={{ fontSize: 14, fontWeight: 700, color: STATUS_CONFIG[result.overall_status]?.color ?? GOLD }}>
                    {result.overall_status}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.7 }}>{result.strategic_implications}</p>
              </div>

              {/* Recommended actions */}
              {result.recommended_actions?.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>Recommended Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.recommended_actions.map((action, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: GOLD, marginTop: 1 }}>{i + 1}</div>
                        <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.6 }}>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category breakdown */}
          <div>
            <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 14 }}>Category Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(result.categories ?? {}).map(([key, catData]) => (
                <CategoryCard key={key} catKey={key} data={catData as CategoryResult} />
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ padding: '14px 18px', border: `1px solid rgba(255,255,255,0.04)`, borderRadius: 10 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.65 }}>
              ⚠ {result.disclaimer || 'This report surfaces publicly available information only. It does not constitute legal advice. Consult a qualified legal professional for legal matters.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
