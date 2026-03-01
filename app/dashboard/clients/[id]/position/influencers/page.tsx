'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Zap, RefreshCw, AlertTriangle,
  CheckCircle, Clock, BarChart3, Copy, ChevronDown,
  ChevronUp, ExternalLink, Users, Star, Lightbulb, Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InfluencerProfile {
  id: string;
  name: string;
  linkedin_url?: string;
  archetype?: string;
  scan_status: 'pending' | 'scanning' | 'completed' | 'failed';
  total_mentions?: number;
  archetype_fit_score?: number;
  content_quality_score?: number;
  aspiration_score?: number;
  style_adaptation_notes?: string;
  uniqueness_guardrails?: string[];
  content_template?: string;
  content_dna?: Record<string, unknown>;
  created_at: string;
}

interface TargetInfluencer {
  name: string;
  archetype: string;
  platforms: string[];
  strategy: string;
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? '#4ade80' : score >= 65 ? GOLD : '#f87171';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{score}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── DNA section ──────────────────────────────────────────────────────────────

function DnaSection({ dna, template, adaptationNotes, guardrails, influencerName }: {
  dna: Record<string, unknown>;
  template?: string;
  adaptationNotes?: string;
  guardrails?: string[];
  influencerName: string;
}) {
  const [tab, setTab] = useState<'structure' | 'style' | 'adapt'>('structure');
  const [copied, setCopied] = useState(false);

  const structure = dna.structure as Record<string, string> | undefined;
  const style     = dna.style     as Record<string, unknown> | undefined;
  const triggers  = dna.emotional_triggers as string[] | undefined;
  const pillars   = dna.content_pillars   as Array<{ theme: string; frequency: string }> | undefined;

  function copyTemplate() {
    navigator.clipboard.writeText(template ?? '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
    background: active ? GOLD : 'transparent',
    color: active ? '#080C14' : 'rgba(255,255,255,0.45)',
    fontWeight: active ? 700 : 400, fontSize: 12,
  });

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: 3, width: 'fit-content', marginBottom: 16 }}>
        <button style={tabStyle(tab === 'structure')} onClick={() => setTab('structure')}>Structure</button>
        <button style={tabStyle(tab === 'style')}     onClick={() => setTab('style')}>Style & Triggers</button>
        <button style={tabStyle(tab === 'adapt')}     onClick={() => setTab('adapt')}>Adaptation Plan</button>
      </div>

      {/* Structure tab */}
      {tab === 'structure' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {structure && Object.entries(structure).map(([key, val]) => (
            <div key={key} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `3px solid ${GOLD}` }}>
              <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {key.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{val}</div>
            </div>
          ))}
          {pillars && pillars.length > 0 && (
            <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Content Pillars</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {pillars.map((p, i) => (
                  <div key={i} style={{ padding: '4px 10px', borderRadius: 20, background: `${GOLD}12`, border: `1px solid ${GOLD}25`, fontSize: 12 }}>
                    <span style={{ color: 'white' }}>{p.theme}</span>
                    <span style={{ color: GOLD, marginLeft: 6 }}>{p.frequency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template */}
          {template && (
            <div style={{ padding: '12px 14px', background: '#0a0f1a', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Reusable Template
                </div>
                <button onClick={copyTemplate} style={{
                  padding: '4px 10px', borderRadius: 6, border: `1px solid ${BORDER}`,
                  background: copied ? 'rgba(74,222,128,0.1)' : 'transparent',
                  color: copied ? '#4ade80' : 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {copied ? <><CheckCircle size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                </button>
              </div>
              <pre style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                {template}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Style tab */}
      {tab === 'style' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {style && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Avg Words',       val: style.avg_words_per_post },
                { label: 'Sentence Len',    val: style.avg_sentence_length },
                { label: 'Active Voice',    val: style.active_voice_pct ? `${style.active_voice_pct}%` : '—' },
                { label: 'Pacing',          val: style.pacing },
                { label: 'Paragraph Len',   val: style.paragraph_length },
                { label: 'Uses Bullets',    val: style.uses_bullets ? 'Yes' : 'No' },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{String(val ?? '—')}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          )}
          {Array.isArray(style?.signature_phrases) && (style.signature_phrases as string[]).length > 0 && (
            <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Signature Phrases</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {(style.signature_phrases as string[]).map((p: string, i: number) => (
                  <span key={i} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                    "{p}"
                  </span>
                ))}
              </div>
            </div>
          )}
          {triggers && triggers.length > 0 && (
            <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Emotional Triggers</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {triggers.map((t, i) => (
                  <span key={i} style={{ padding: '3px 10px', borderRadius: 20, background: `${GOLD}12`, border: `1px solid ${GOLD}30`, fontSize: 12, color: GOLD }}>
                    {t.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(dna.what_makes_them_followable as string) && (
            <div style={{ padding: '12px 14px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Why They Work</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{dna.what_makes_them_followable as string}</div>
            </div>
          )}
        </div>
      )}

      {/* Adaptation tab */}
      {tab === 'adapt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {adaptationNotes && (
            <div style={{ padding: '14px 16px', background: `${GOLD}08`, border: `1px solid ${GOLD}25`, borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lightbulb size={11} /> Style Adaptation for Your Brand
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>{adaptationNotes}</p>
            </div>
          )}
          {guardrails && guardrails.length > 0 && (
            <div style={{ padding: '14px 16px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={11} /> Uniqueness Guardrails
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {guardrails.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa' }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, margin: 0 }}>{g}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(dna.weaknesses_to_avoid as string) && (
            <div style={{ padding: '12px 14px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Their Weaknesses — Don't Copy These</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>{dna.weaknesses_to_avoid as string}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Influencer card ──────────────────────────────────────────────────────────

function InfluencerCard({ profile, onDiscover }: {
  profile: InfluencerProfile;
  onDiscover: (id: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = profile.scan_status === 'completed' ? '#4ade80'
    : profile.scan_status === 'scanning'  ? GOLD
    : profile.scan_status === 'failed'    ? '#f87171'
    : 'rgba(255,255,255,0.3)';

  const statusLabel = profile.scan_status === 'completed' ? 'DNA Extracted'
    : profile.scan_status === 'scanning'  ? 'Scanning…'
    : profile.scan_status === 'failed'    ? 'Scan Failed'
    : 'Pending';

  const avgScore = profile.aspiration_score ?? (
    profile.archetype_fit_score && profile.content_quality_score
      ? Math.round((profile.archetype_fit_score + profile.content_quality_score) / 2)
      : null
  );

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${GOLD}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: GOLD }}>
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{profile.name}</div>
                {profile.archetype && (
                  <div style={{ fontSize: 11, color: GOLD, marginTop: 1 }}>{profile.archetype}</div>
                )}
              </div>
            </div>
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{
                fontSize: 11, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4,
                textDecoration: 'none', marginTop: 4,
              }}>
                <ExternalLink size={10} /> LinkedIn Profile
              </a>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: `${statusColor}15`, color: statusColor,
              border: `1px solid ${statusColor}40`,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {profile.scan_status === 'scanning' && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />
              )}
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Scores row */}
        {profile.scan_status === 'completed' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 9, marginBottom: 12 }}>
            <ScoreBadge score={profile.archetype_fit_score ?? 0}   label="Archetype Fit" />
            <ScoreBadge score={profile.content_quality_score ?? 0} label="Content Quality" />
            <ScoreBadge score={profile.aspiration_score ?? 0}      label="Aspiration Score" />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(profile.scan_status === 'pending' || profile.scan_status === 'failed') && (
            <button onClick={() => onDiscover(profile.id, profile.name)} style={{
              flex: 1, padding: '9px', borderRadius: 8, background: GOLD, color: '#080C14',
              fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Zap size={13} /> {profile.scan_status === 'failed' ? 'Retry Discovery' : 'Run Discovery'}
            </button>
          )}
          {profile.scan_status === 'scanning' && (
            <div style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'rgba(201,168,76,0.15)', color: GOLD, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Extracting DNA…
            </div>
          )}
          {profile.scan_status === 'completed' && (
            <button onClick={() => setExpanded(e => !e)} style={{
              flex: 1, padding: '9px', borderRadius: 8, border: `1px solid ${BORDER}`,
              background: 'transparent', color: expanded ? GOLD : 'rgba(255,255,255,0.55)',
              fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Hide DNA' : 'View Full DNA'}
            </button>
          )}
        </div>
      </div>

      {/* Expanded DNA */}
      {expanded && profile.content_dna && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '0 20px 20px' }}>
          <DnaSection
            dna={profile.content_dna}
            template={profile.content_template}
            adaptationNotes={profile.style_adaptation_notes}
            guardrails={profile.uniqueness_guardrails}
            influencerName={profile.name}
          />
        </div>
      )}
    </div>
  );
}

// ─── Add influencer modal ─────────────────────────────────────────────────────

function AddInfluencerModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (name: string, linkedin: string, archetype: string) => void;
}) {
  const [name,      setName]      = useState('');
  const [linkedin,  setLinkedin]  = useState('');
  const [archetype, setArchetype] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
    color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Inter', system-ui",
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#0d1117', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 420 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 20 }}>Add Influencer to Analyse</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ankur Warikoo" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LinkedIn URL</label>
            <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Their Archetype</label>
            <input value={archetype} onChange={e => setArchetype(e.target.value)} placeholder="e.g. The Maven, The Challenger" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => { if (name.trim()) { onAdd(name.trim(), linkedin.trim(), archetype.trim()); onClose(); } }}
            disabled={!name.trim()}
            style={{ flex: 2, padding: '10px', borderRadius: 8, background: name.trim() ? GOLD : 'rgba(201,168,76,0.4)', color: '#080C14', fontWeight: 700, fontSize: 13, border: 'none', cursor: name.trim() ? 'pointer' : 'not-allowed' }}>
            Add & Queue Discovery
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InfluencersPage() {
  const params   = useParams();
  const router   = useRouter();
  const clientId = params.id as string;

  const [profiles,    setProfiles]    = useState<InfluencerProfile[]>([]);
  const [aiSuggested, setAiSuggested] = useState<TargetInfluencer[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [discovering, setDiscovering] = useState<Set<string>>(new Set());
  const [error,       setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profileData }, { data: pos }] = await Promise.all([
      supabase.from('influencer_profiles').select('*').eq('client_id', clientId).order('aspiration_score', { ascending: false }),
      supabase.from('positioning').select('target_influencers').eq('client_id', clientId).maybeSingle(),
    ]);
    setProfiles((profileData ?? []) as InfluencerProfile[]);
    setAiSuggested((pos?.target_influencers as TargetInfluencer[]) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function addAndQueueInfluencer(name: string, linkedin: string, archetype: string) {
    // Insert to DB first
    const { data, error: err } = await supabase.from('influencer_profiles').insert({
      client_id:    clientId,
      name,
      linkedin_url: linkedin || null,
      archetype:    archetype || null,
      scan_status:  'pending',
    }).select().single();

    if (err || !data) { setError(err?.message ?? 'Failed to add'); return; }
    const profile = data as InfluencerProfile;
    setProfiles(prev => [profile, ...prev]);
    // Auto-trigger discovery
    runDiscovery(profile.id, name, linkedin);
  }

  async function runDiscovery(profileId: string, name: string, linkedinUrl?: string) {
    setDiscovering(prev => new Set(prev).add(profileId));
    setError('');

    // Mark as scanning in UI immediately
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, scan_status: 'scanning' as const } : p));

    try {
      const res = await fetch('/api/influencer/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, influencerName: name, linkedinUrl, archetype: profiles.find(p => p.id === profileId)?.archetype ?? '' }),
      });

      if (!res.ok) {
        const e = await res.json() as { error?: string };
        throw new Error(e.error ?? `HTTP ${res.status}`);
      }

      // Reload to get full profile with scores
      const { data: updated } = await supabase.from('influencer_profiles').select('*').eq('id', profileId).single();
      if (updated) {
        setProfiles(prev => prev.map(p => p.id === profileId ? updated as InfluencerProfile : p));
      }
    } catch (e) {
      setError(`Discovery failed for ${name}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, scan_status: 'failed' as const } : p));
    } finally {
      setDiscovering(prev => { const s = new Set(prev); s.delete(profileId); return s; });
    }
  }

  // Queue discovery for AI-suggested influencers not yet in DB
  async function addAISuggestedInfluencer(inf: TargetInfluencer) {
    await addAndQueueInfluencer(inf.name, '', inf.archetype);
  }

  const completedCount = profiles.filter(p => p.scan_status === 'completed').length;
  const topProfile     = profiles.find(p => p.scan_status === 'completed' && p.aspiration_score != null);

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} /> Loading influencer intelligence…
    </div>
  );

  return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {showAdd && <AddInfluencerModal onClose={() => setShowAdd(false)} onAdd={addAndQueueInfluencer} />}

      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => router.push(`/dashboard/clients/${clientId}/position`)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <ArrowLeft size={15} /> Position
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>Influencer Intelligence</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Discover content DNA from aspirational role models · Build unique adapted strategies</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '9px 16px', borderRadius: 8, background: GOLD, color: '#080C14',
          fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Search size={13} /> Add Influencer
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Tracked',          val: profiles.length,  icon: <Users size={15} />,    color: GOLD },
          { label: 'DNA Extracted',    val: completedCount,   icon: <BarChart3 size={15} />, color: '#4ade80' },
          { label: 'Top Aspiration',   val: topProfile ? `${topProfile.aspiration_score}/100` : '—', icon: <Star size={15} />, color: '#818cf8' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* AI suggested influencers (from positioning) */}
      {aiSuggested.length > 0 && profiles.length === 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            AI-Suggested Influencers from Positioning
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
            These were mapped during your archetype analysis. Click to run content DNA discovery on each.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiSuggested.map((inf, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 9, border: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{inf.name}</div>
                  <div style={{ fontSize: 12, color: GOLD, marginTop: 2 }}>{inf.archetype}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{inf.strategy}</div>
                </div>
                <button onClick={() => addAISuggestedInfluencer(inf)} style={{
                  padding: '8px 14px', borderRadius: 8, background: GOLD, color: '#080C14',
                  fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Zap size={12} /> Discover DNA
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile cards */}
      {profiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
          <Users size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.2 }} />
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>No influencers tracked yet</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
            Add thought leaders who embody your target archetype. We'll extract their content DNA and build a personalised content adaptation strategy.
          </p>
          <button onClick={() => setShowAdd(true)} style={{
            padding: '10px 20px', borderRadius: 8, background: GOLD, color: '#080C14',
            fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
          }}>
            Add First Influencer
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {profiles.map(profile => (
            <InfluencerCard
              key={profile.id}
              profile={profile}
              onDiscover={(id, name) => runDiscovery(id, name, profile.linkedin_url)}
            />
          ))}
        </div>
      )}

      {/* How it works */}
      <div style={{ marginTop: 28, padding: '16px 20px', background: `${GOLD}06`, border: `1px solid ${GOLD}15`, borderRadius: 12 }}>
        <div style={{ fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={11} /> How Influencer Discovery Works
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          {[
            { n: '1', t: 'Search', d: 'SerpAPI + Exa.ai find their top LinkedIn posts and articles' },
            { n: '2', t: 'Scrape', d: 'Firecrawl extracts full content from the top 3 posts' },
            { n: '3', t: 'Extract', d: 'Claude 3.5 analyses structure, style, triggers and template' },
            { n: '4', t: 'Adapt',  d: 'AI generates a client-specific version — your voice, their blueprint' },
          ].map(({ n, t, d }) => (
            <div key={n}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{n}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 3 }}>{t}</div>
              <div style={{ fontSize: 11, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
