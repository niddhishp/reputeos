'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield, RefreshCw, Plus, Zap, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Bell, BellOff, Trash2,
  BarChart3, Users, Eye, MessageSquare, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alert {
  id: string;
  type: 'crisis' | 'volume_spike' | 'sentiment_drop' | 'narrative_drift';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  status: 'new' | 'acknowledged' | 'resolved';
  created_at: string;
}

interface Competitor {
  id: string;
  name: string;
  company?: string;
  linkedin_url?: string;
  current_lsi?: number;
  archetype?: string;
  content_volume_per_month?: number;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityColor(s: string) {
  if (s === 'critical') return '#f87171';
  if (s === 'warning')  return '#fb923c';
  return '#60a5fa';
}

function alertIcon(type: string, color: string) {
  const size = 16;
  if (type === 'crisis')          return <Zap size={size} color={color} />;
  if (type === 'volume_spike')    return <TrendingUp size={size} color={color} />;
  if (type === 'sentiment_drop')  return <TrendingDown size={size} color={color} />;
  if (type === 'narrative_drift') return <MessageSquare size={size} color={color} />;
  return <AlertTriangle size={size} color={color} />;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Alert card ───────────────────────────────────────────────────────────────

function AlertCard({ alert, onAck, onResolve }: {
  alert: Alert;
  onAck: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const color = severityColor(alert.severity);
  return (
    <div style={{
      background: CARD, borderRadius: 10, padding: '14px 16px',
      border: `1px solid ${alert.severity === 'critical' ? 'rgba(248,113,113,0.4)' : alert.severity === 'warning' ? 'rgba(251,146,60,0.3)' : BORDER}`,
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          {alertIcon(alert.type, color)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{alert.title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ padding: '2px 8px', borderRadius: 10, background: `${color}15`, fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase' }}>
                {alert.severity}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{timeAgo(alert.created_at)}</span>
            </div>
          </div>
          {alert.message && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 10 }}>{alert.message}</p>
          )}
          {alert.status === 'new' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onAck(alert.id)} style={{
                padding: '5px 12px', borderRadius: 6, border: `1px solid ${BORDER}`,
                background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer',
              }}>
                Acknowledge
              </button>
              <button onClick={() => onResolve(alert.id)} style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(74,222,128,0.3)',
                background: 'rgba(74,222,128,0.08)', color: '#4ade80', fontSize: 11, cursor: 'pointer',
              }}>
                Mark Resolved
              </button>
            </div>
          )}
          {alert.status === 'acknowledged' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, color: GOLD, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={11} /> Acknowledged
              </span>
              <button onClick={() => onResolve(alert.id)} style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(74,222,128,0.3)',
                background: 'rgba(74,222,128,0.08)', color: '#4ade80', fontSize: 11, cursor: 'pointer',
              }}>
                Resolve
              </button>
            </div>
          )}
          {alert.status === 'resolved' && (
            <span style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={11} /> Resolved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Competitor card ──────────────────────────────────────────────────────────

function CompetitorCard({ comp, onDelete }: { comp: Competitor; onDelete: (id: string) => void }) {
  const lsi = comp.current_lsi ?? 0;
  const lsiColor = lsi >= 71 ? '#4ade80' : lsi >= 56 ? GOLD : '#f87171';

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 2 }}>{comp.name}</div>
          {comp.company && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{comp.company}</div>}
          {comp.archetype && (
            <div style={{ fontSize: 11, color: GOLD, marginTop: 4, padding: '2px 8px', background: `${GOLD}10`, borderRadius: 10, display: 'inline-block' }}>
              {comp.archetype}
            </div>
          )}
        </div>
        <button onClick={() => onDelete(comp.id)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.2)', padding: 4, borderRadius: 4,
        }}>
          <Trash2 size={13} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: lsiColor }}>{lsi > 0 ? lsi.toFixed(0) : '—'}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>LSI Score</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{comp.content_volume_per_month ?? '—'}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Posts/month</div>
        </div>
      </div>

      {comp.linkedin_url && (
        <a href={comp.linkedin_url} target="_blank" rel="noopener noreferrer" style={{
          display: 'block', marginTop: 10, fontSize: 11, color: '#60a5fa',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {comp.linkedin_url}
        </a>
      )}
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
        Updated {timeAgo(comp.updated_at)}
      </div>
    </div>
  );
}

// ─── Add competitor modal ─────────────────────────────────────────────────────

function AddCompetitorModal({ clientId, onClose, onAdded }: {
  clientId: string; onClose: () => void; onAdded: (c: Competitor) => void;
}) {
  const [name,       setName]       = useState('');
  const [company,    setCompany]    = useState('');
  const [linkedin,   setLinkedin]   = useState('');
  const [lsi,        setLsi]        = useState('');
  const [volume,     setVolume]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  async function save() {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    try {
      const { data, error: err } = await supabase.from('competitors').insert({
        client_id: clientId,
        name: name.trim(),
        company: company.trim() || null,
        linkedin_url: linkedin.trim() || null,
        current_lsi: lsi ? parseFloat(lsi) : null,
        content_volume_per_month: volume ? parseInt(volume) : null,
      }).select().single();
      if (err) throw err;
      onAdded(data as Competitor);
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
    color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Inter', system-ui",
  };
  const label: React.CSSProperties = {
    fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#0d1117', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 32, width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>Track Competitor</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <span style={label}>Name *</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma" style={inputStyle} />
          </div>
          <div>
            <span style={label}>Company</span>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. TechVentures" style={inputStyle} />
          </div>
          <div>
            <span style={label}>LinkedIn URL</span>
            <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span style={label}>Their LSI Score</span>
              <input type="number" value={lsi} onChange={e => setLsi(e.target.value)} placeholder="0–100" style={inputStyle} min="0" max="100" />
            </div>
            <div>
              <span style={label}>Posts/Month</span>
              <input type="number" value={volume} onChange={e => setVolume(e.target.value)} placeholder="e.g. 20" style={inputStyle} min="0" />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '9px 14px', marginBottom: 16, color: '#f87171', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={13} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving || !name.trim()} style={{
            flex: 2, padding: '10px', borderRadius: 8,
            background: saving || !name.trim() ? 'rgba(201,168,76,0.4)' : GOLD,
            color: '#080C14', fontWeight: 700, fontSize: 13, border: 'none',
            cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving…' : 'Add Competitor'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Crisis Playbooks ─────────────────────────────────────────────────────────

const PLAYBOOKS = [
  {
    title: 'Media Crisis',
    trigger: 'Negative press spike (3× normal volume)',
    steps: ['Acknowledge within 2 hours on LinkedIn', 'Issue factual clarification statement', 'Engage 3 key advocates to amplify counter-narrative', 'Monitor sentiment hourly for 48h', 'Post resolution update within 72h'],
    severity: 'critical',
  },
  {
    title: 'Viral Negative Post',
    trigger: 'Single post >500 negative reactions',
    steps: ['Do not delete (Streisand effect)', 'Respond factually within 1 hour', 'DM top critics directly', 'Post follow-up content on original topic within 24h'],
    severity: 'warning',
  },
  {
    title: 'Regulatory Mention',
    trigger: 'Keywords: fraud, lawsuit, sebi, enforcement',
    steps: ['Legal review within 1 hour', 'No public comment until cleared', 'Prepare holding statement', 'Monitor spread velocity', 'Coordinate with PR team'],
    severity: 'critical',
  },
  {
    title: 'Competitor Attack',
    trigger: 'Competitor tags you negatively',
    steps: ['Do not engage directly', 'Post strong positive thought leadership within 6h', 'Rally advocates with direct outreach', 'Document for future reference'],
    severity: 'warning',
  },
];

function PlaybookCard({ pb }: { pb: typeof PLAYBOOKS[0] }) {
  const [open, setOpen] = useState(false);
  const color = pb.severity === 'critical' ? '#f87171' : '#fb923c';
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '14px 16px', background: 'transparent', border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{pb.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{pb.trigger}</div>
        </div>
        <span style={{ fontSize: 11, color: color, border: `1px solid ${color}40`, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', flexShrink: 0 }}>
          {pb.severity}
        </span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pb.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${color}15`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginTop: 2 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Shield Page ─────────────────────────────────────────────────────────

export default function ShieldPage() {
  const params   = useParams();
  const clientId = params.id as string;

  const [alerts,      setAlerts]      = useState<Alert[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [monitoring,  setMonitoring]  = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [filterStatus,setFilterStatus]= useState<'all' | 'new' | 'acknowledged' | 'resolved'>('all');
  const [tab,         setTab]         = useState<'alerts' | 'competitors' | 'playbooks'>('alerts');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: al }, { data: co }] = await Promise.all([
      supabase.from('alerts').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
      supabase.from('competitors').select('*').eq('client_id', clientId).order('updated_at', { ascending: false }),
    ]);
    setAlerts((al ?? []) as Alert[]);
    setCompetitors((co ?? []) as Competitor[]);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  // Real-time alerts subscription
  useEffect(() => {
    const sub = supabase
      .channel(`shield-alerts-${clientId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'alerts',
        filter: `client_id=eq.${clientId}`,
      }, payload => {
        setAlerts(prev => [payload.new as Alert, ...prev]);
      })
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [clientId]);

  async function acknowledge(id: string) {
    await supabase.from('alerts').update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' as const } : a));
  }

  async function resolve(id: string) {
    await supabase.from('alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a));
  }

  async function deleteCompetitor(id: string) {
    if (!confirm('Remove this competitor?')) return;
    await supabase.from('competitors').delete().eq('id', id);
    setCompetitors(prev => prev.filter(c => c.id !== id));
  }

  const filteredAlerts = alerts.filter(a => filterStatus === 'all' || a.status === filterStatus);
  const newAlerts      = alerts.filter(a => a.status === 'new').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'new').length;

  const card: React.CSSProperties = { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <RefreshCw size={21} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} /> Loading Shield…
    </div>
  );

  return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {showAdd && (
        <AddCompetitorModal
          clientId={clientId}
          onClose={() => setShowAdd(false)}
          onAdded={c => setCompetitors(prev => [c, ...prev])}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>Shield</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Crisis detection · Competitor intelligence · Rapid response</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setMonitoring(m => !m)} style={{
            padding: '8px 14px', borderRadius: 20, border: `1px solid ${monitoring ? 'rgba(74,222,128,0.4)' : BORDER}`,
            background: monitoring ? 'rgba(74,222,128,0.1)' : 'transparent',
            color: monitoring ? '#4ade80' : 'rgba(255,255,255,0.4)',
            fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {monitoring
              ? <><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1.5s ease-in-out infinite' }} /> Monitoring Active</>
              : <><BellOff size={12} /> Monitoring Paused</>}
          </button>
          <button onClick={load} style={{
            padding: '8px', borderRadius: 8, border: `1px solid ${BORDER}`,
            background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
          }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Critical alert banner */}
      {criticalAlerts > 0 && (
        <div style={{
          background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.4)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Zap size={18} color="#f87171" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>
              {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''} Require Immediate Action
            </div>
            <div style={{ fontSize: 12, color: 'rgba(248,113,113,0.7)', marginTop: 2 }}>
              Review alerts below and initiate response playbook if needed.
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'New Alerts',    value: newAlerts,          color: newAlerts > 0 ? '#f87171' : '#4ade80', icon: <Bell size={16} /> },
          { label: 'Competitors',   value: competitors.length,  color: GOLD,    icon: <Users size={16} /> },
          { label: 'Resolved (30d)',value: alerts.filter(a => a.status === 'resolved').length, color: '#4ade80', icon: <CheckCircle size={16} /> },
          { label: 'Active Playbooks', value: PLAYBOOKS.length, color: '#60a5fa', icon: <BarChart3 size={16} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {([
          { id: 'alerts',      label: `Alerts${newAlerts > 0 ? ` (${newAlerts})` : ''}` },
          { id: 'competitors', label: `Competitors (${competitors.length})` },
          { id: 'playbooks',   label: `Playbooks (${PLAYBOOKS.length})` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: tab === t.id ? GOLD : 'transparent',
            color: tab === t.id ? '#080C14' : 'rgba(255,255,255,0.5)',
            fontWeight: tab === t.id ? 700 : 400, fontSize: 13,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Alerts tab ── */}
      {tab === 'alerts' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Alert Feed
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'new', 'acknowledged', 'resolved'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: '4px 10px', borderRadius: 16, cursor: 'pointer',
                  border: `1px solid ${filterStatus === s ? GOLD : BORDER}`,
                  background: filterStatus === s ? `${GOLD}15` : 'transparent',
                  color: filterStatus === s ? GOLD : 'rgba(255,255,255,0.4)',
                  fontSize: 11, textTransform: 'capitalize',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {filteredAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.3)' }}>
              <Shield size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>
                {filterStatus === 'all' ? 'No alerts — all clear.' : `No ${filterStatus} alerts.`}
              </p>
              <p style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.2)' }}>
                Alerts are generated by the monitoring system and Vercel Cron jobs.
              </p>
            </div>
          ) : (
            filteredAlerts.map(a => (
              <AlertCard key={a.id} alert={a} onAck={acknowledge} onResolve={resolve} />
            ))
          )}
        </div>
      )}

      {/* ── Competitors tab ── */}
      {tab === 'competitors' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Competitor Intelligence
            </h3>
            <button onClick={() => setShowAdd(true)} style={{
              padding: '8px 14px', borderRadius: 8, background: GOLD, color: '#080C14',
              fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Plus size={13} /> Track Competitor
            </button>
          </div>

          {competitors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.3)' }}>
              <Users size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>No competitors tracked yet.</p>
              <p style={{ fontSize: 12, marginTop: 6, color: 'rgba(255,255,255,0.2)' }}>
                Add competitors to benchmark their LSI and content volume.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {competitors.map(c => (
                <CompetitorCard key={c.id} comp={c} onDelete={deleteCompetitor} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Playbooks tab ── */}
      {tab === 'playbooks' && (
        <div style={card}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Crisis Response Playbooks
            </h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              Pre-built response protocols. Click any playbook to reveal step-by-step actions.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLAYBOOKS.map((pb, i) => <PlaybookCard key={i} pb={pb} />)}
          </div>

          <div style={{ marginTop: 20, padding: '14px 16px', background: `${GOLD}08`, border: `1px solid ${GOLD}25`, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={13} /> Monitoring Setup
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Automated monitoring runs every 4 hours via Vercel Cron. Configure the cron job at{' '}
              <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>
                /api/cron/crisis-monitor
              </code>{' '}
              to enable real-time alerts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
