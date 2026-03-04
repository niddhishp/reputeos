'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus, RefreshCw, AlertTriangle, Copy, CheckCircle,
  Sparkles, FileText, Twitter, Linkedin, BookOpen, Mic, AlignLeft,
  ArrowRight, Trash2, Clock, ChevronDown, ChevronUp, Zap, LayoutGrid,
  Target, Layers,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';
const BG     = '#080C14';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentItem {
  id: string; title: string; body: string; platform: string;
  status: 'draft' | 'published'; nlp_compliance: Record<string, unknown>;
  created_at: string;
}

interface ContentPillar {
  name: string;
  themes: string[];
  frequency?: string;
  formats?: string[];
}

interface Positioning {
  personal_archetype: string;
  business_archetype?: string;
  positioning_statement?: string;
  content_pillars: ContentPillar[];
  signature_lines?: string[];
}

interface InfluencerTemplate {
  id: string; name: string; archetype: string;
  aspiration_score: number; content_template: string;
  style_adaptation_notes: string;
}

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'linkedin_long',  label: 'LinkedIn Article', icon: Linkedin,  color: '#0A66C2', desc: '800–1,200 words' },
  { id: 'linkedin_short', label: 'LinkedIn Post',    icon: Linkedin,  color: '#0A66C2', desc: '150–250 words'   },
  { id: 'twitter_thread', label: 'X Thread',         icon: Twitter,   color: '#1DA1F2', desc: '10–15 tweets'    },
  { id: 'oped',           label: 'Op-Ed',            icon: FileText,  color: '#fb923c', desc: 'ET / Mint / Bloomberg' },
  { id: 'whitepaper',     label: 'Whitepaper',       icon: BookOpen,  color: '#818cf8', desc: '1,500–2,500 words' },
  { id: 'keynote',        label: 'Keynote Outline',  icon: Mic,       color: '#f472b6', desc: '30-min talk' },
] as const;

const TONES = [
  { id: 'authoritative',  label: 'Authoritative'  },
  { id: 'conversational', label: 'Conversational' },
  { id: 'provocative',    label: 'Provocative'    },
  { id: 'analytical',     label: 'Analytical'     },
] as const;

type PlatformId = typeof PLATFORMS[number]['id'];

function platformLabel(id: string) {
  return PLATFORMS.find(p => p.id === id)?.label ?? id;
}
function PlatformIcon({ id, size = 14 }: { id: string; size?: number }) {
  const p = PLATFORMS.find(pl => pl.id === id);
  if (!p) return <AlignLeft size={size} color="rgba(255,255,255,0.4)" />;
  const Icon = p.icon;
  return <Icon size={size} color={p.color} />;
}

// ─── NLP Badge ────────────────────────────────────────────────────────────────

function NLPBadge({ compliance }: { compliance: Record<string, unknown> }) {
  const passes = [compliance.hasAuthorityMarkers, compliance.expertFramePresent, compliance.familyFrameAbsent].filter(Boolean).length;
  const color = passes === 3 ? '#4ade80' : passes === 2 ? GOLD : '#f87171';
  const label = passes === 3 ? 'NLP Compliant' : passes === 2 ? 'Needs review' : 'Non-compliant';
  return (
    <span style={{ padding: '2px 8px', borderRadius: 10, background: `${color}15`, border: `1px solid ${color}40`, fontSize: 11, fontWeight: 600, color }}>{label}</span>
  );
}

// ─── Content Viewer ───────────────────────────────────────────────────────────

function ContentViewer({ item, onClose, onDelete }: { item: ContentItem; onClose: () => void; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const compliance = item.nlp_compliance ?? {};
  const words = item.body.split(/\s+/).filter(Boolean).length;

  function copy() { navigator.clipboard.writeText(item.body); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, width: '100%', maxWidth: 780, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <PlatformIcon id={item.platform} size={15} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{platformLabel(item.platform)}</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{item.title || 'Content Draft'}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={copy} style={{ padding: '8px 14px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: copied ? '#4ade80' : 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {copied ? <CheckCircle size={13} /> : <Copy size={13} />} {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Authority Markers', pass: compliance.hasAuthorityMarkers },
            { label: 'Expert Frame',      pass: compliance.expertFramePresent  },
            { label: 'No Family Frame',   pass: compliance.familyFrameAbsent   },
          ].map(({ label, pass }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 10, background: pass ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${pass ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
              {pass ? <CheckCircle size={11} color="#4ade80" /> : <AlertTriangle size={11} color="#f87171" />}
              <span style={{ fontSize: 11, color: pass ? '#4ade80' : '#f87171' }}>{label}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} /> {words} words · ~{Math.ceil(words / 200)} min read
          </div>
        </div>
        <pre style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 20, maxHeight: '60vh', overflowY: 'auto' }}>
          {item.body}
        </pre>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button onClick={() => { onDelete(item.id); onClose(); }} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Trash2 size={12} /> Delete Draft
          </button>
          <button onClick={copy} style={{ padding: '9px 18px', borderRadius: 7, background: GOLD, color: BG, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Content'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pillar Generate Panel ─────────────────────────────────────────────────────
// Inline generator scoped to a single content pillar

function PillarGeneratePanel({ pillar, clientId, positioning, influencerTemplates, onCreated, onClose }: {
  pillar: ContentPillar;
  clientId: string;
  positioning: Positioning;
  influencerTemplates: InfluencerTemplate[];
  onCreated: (item: ContentItem) => void;
  onClose: () => void;
}) {
  const [platform,   setPlatform]   = useState<PlatformId>('linkedin_long');
  const [tone,       setTone]       = useState('authoritative');
  const [topic,      setTopic]      = useState('');
  const [templateId, setTemplateId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState('');
  const [result,     setResult]     = useState<ContentItem | null>(null);

  async function generate(overrideTopic?: string) {
    const t = overrideTopic ?? topic;
    if (!t.trim()) { setError('Select a theme or enter a topic'); return; }
    setGenerating(true); setError(''); setResult(null);
    try {
      const res  = await fetch('/api/content/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, platform, topic: t, tone, templateId: templateId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Generation failed');
      const item: ContentItem = {
        id: data.contentId, title: t.slice(0, 80),
        body: data.content, platform,
        status: 'draft', nlp_compliance: data.compliance,
        created_at: new Date().toISOString(),
      };
      setResult(item);
      onCreated(item);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setGenerating(false); }
  }

  if (result) {
    return (
      <div style={{ padding: '20px 24px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle size={15} color="#4ade80" />
          <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>Content generated for {pillar.name}</span>
          <button onClick={() => setResult(null)} style={{ marginLeft: 'auto', padding: '5px 11px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Generate Another</button>
          <button onClick={onClose} style={{ padding: '5px 11px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Done</button>
        </div>
        <pre style={{ fontFamily: "'Inter', system-ui", fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '14px 16px', maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
          {result.body.slice(0, 600)}{result.body.length > 600 ? '…' : ''}
        </pre>
        <button onClick={() => { navigator.clipboard.writeText(result.body); }} style={{ padding: '8px 16px', borderRadius: 7, background: GOLD, color: BG, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Copy size={12} /> Copy Full Content
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px', borderTop: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.01)' }}>
      {/* Theme chips */}
      {pillar.themes?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Quick-start from a theme</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {pillar.themes.map((theme, i) => (
              <button key={i} onClick={() => { setTopic(theme); generate(theme); }}
                style={{ padding: '5px 12px', borderRadius: 20, background: `${GOLD}10`, border: `1px solid ${GOLD}30`, fontSize: 12, color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Zap size={10} /> {theme}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Platform + Tone row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Format</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {PLATFORMS.map(p => {
              const Icon = p.icon;
              const sel = platform === p.id;
              return (
                <button key={p.id} onClick={() => setPlatform(p.id as PlatformId)} style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${sel ? p.color : BORDER}`, background: sel ? `${p.color}15` : 'transparent', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: sel ? 'white' : 'rgba(255,255,255,0.4)' }}>
                  <Icon size={11} color={sel ? p.color : 'rgba(255,255,255,0.3)'} /> {p.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Voice Tone</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {TONES.map(t => (
              <button key={t.id} onClick={() => setTone(t.id)} style={{ padding: '5px 10px', borderRadius: 20, border: `1px solid ${tone === t.id ? GOLD : BORDER}`, background: tone === t.id ? `${GOLD}15` : 'transparent', fontSize: 11, color: tone === t.id ? GOLD : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Influencer style */}
      {influencerTemplates.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Style Template <span style={{ color: GOLD, fontWeight: 400 }}>(optional)</span></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setTemplateId('')} style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${!templateId ? GOLD : BORDER}`, background: !templateId ? `${GOLD}12` : 'transparent', fontSize: 11, color: !templateId ? GOLD : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>My Own Style</button>
            {influencerTemplates.map(t => (
              <button key={t.id} onClick={() => setTemplateId(t.id)} style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${templateId === t.id ? '#818cf8' : BORDER}`, background: templateId === t.id ? 'rgba(129,140,248,0.12)' : 'transparent', fontSize: 11, color: templateId === t.id ? '#818cf8' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                {t.name} <span style={{ opacity: 0.5, fontSize: 10 }}>·{t.aspiration_score}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom topic */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Or write your own topic</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={topic} onChange={e => setTopic(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && topic.trim()) generate(); }}
            placeholder={`e.g. Why ${pillar.themes[0] ?? pillar.name} is changing the industry`}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${topic ? GOLD + '60' : BORDER}`, color: 'white', fontSize: 13, outline: 'none', fontFamily: "'Inter', system-ui" }}
          />
          <button onClick={() => generate(topic.trim() || pillar.name)} disabled={generating} style={{ padding: '9px 18px', borderRadius: 8, background: generating ? 'rgba(201,168,76,0.3)' : GOLD, color: BG, fontWeight: 700, fontSize: 13, border: 'none', cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            {generating ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />Generating…</> : <><Sparkles size={13} />Generate</>}
          </button>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '11px 14px', marginTop: 12, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}><AlertTriangle size={14} />{error}</div>}
    </div>
  );
}

// ─── Pillar Card ──────────────────────────────────────────────────────────────

const PILLAR_COLORS = ['#818cf8', '#34d399', GOLD, '#f472b6', '#60a5fa', '#fb923c'];

function PillarCard({ pillar, index, clientId, positioning, influencerTemplates, pillarContentCount, onCreated }: {
  pillar: ContentPillar;
  index: number;
  clientId: string;
  positioning: Positioning;
  influencerTemplates: InfluencerTemplate[];
  pillarContentCount: number;
  onCreated: (item: ContentItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const color = PILLAR_COLORS[index % PILLAR_COLORS.length];

  return (
    <div style={{ background: CARD, border: `1px solid ${open ? color + '60' : BORDER}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 200ms' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Color dot + pillar number */}
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color }}>{index + 1}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{pillar.name}</span>
            {pillarContentCount > 0 && (
              <span style={{ padding: '2px 7px', borderRadius: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', fontSize: 11, color: '#4ade80' }}>{pillarContentCount} created</span>
            )}
          </div>
          {pillar.themes?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {pillar.themes.slice(0, 4).map((t, i) => (
                <span key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }}>{t}</span>
              ))}
              {(pillar.themes.length > 4) && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>+{pillar.themes.length - 4} more</span>}
            </div>
          )}
          {pillar.frequency && <div style={{ fontSize: 11, color: color, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{pillar.frequency}</div>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ padding: '6px 12px', borderRadius: 7, background: `${color}15`, border: `1px solid ${color}35`, fontSize: 12, fontWeight: 600, color, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={11} /> {open ? 'Close' : 'Generate Content'}
          </div>
          {open ? <ChevronUp size={14} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.3)" />}
        </div>
      </div>

      {open && (
        <PillarGeneratePanel
          pillar={pillar}
          clientId={clientId}
          positioning={positioning}
          influencerTemplates={influencerTemplates}
          onCreated={onCreated}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Custom Create Panel ───────────────────────────────────────────────────────

function CustomCreatePanel({ clientId, positioning, influencerTemplates, onCreated }: {
  clientId: string;
  positioning: Positioning | null;
  influencerTemplates: InfluencerTemplate[];
  onCreated: (item: ContentItem) => void;
}) {
  const [platform,   setPlatform]   = useState<PlatformId>('linkedin_long');
  const [tone,       setTone]       = useState('authoritative');
  const [topic,      setTopic]      = useState('');
  const [templateId, setTemplateId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState('');
  const [result,     setResult]     = useState<ContentItem | null>(null);

  async function generate() {
    if (!topic.trim()) { setError('Enter a topic'); return; }
    setGenerating(true); setError(''); setResult(null);
    try {
      const res  = await fetch('/api/content/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, platform, topic, tone, templateId: templateId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Generation failed');
      const item: ContentItem = {
        id: data.contentId, title: topic.slice(0, 80), body: data.content, platform,
        status: 'draft', nlp_compliance: data.compliance, created_at: new Date().toISOString(),
      };
      setResult(item); onCreated(item);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setGenerating(false); }
  }

  if (result) return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <CheckCircle size={15} color="#4ade80" />
        <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>Content generated</span>
        <button onClick={() => setResult(null)} style={{ marginLeft: 'auto', padding: '5px 11px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>Generate Another</button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Platform grid */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Platform</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {PLATFORMS.map(p => {
            const sel = platform === p.id; const Icon = p.icon;
            return (
              <button key={p.id} onClick={() => setPlatform(p.id as PlatformId)} style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${sel ? p.color : BORDER}`, background: sel ? `${p.color}15` : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={13} color={sel ? p.color : 'rgba(255,255,255,0.4)'} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: sel ? 'white' : 'rgba(255,255,255,0.5)' }}>{p.label}</span>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Voice Tone</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TONES.map(t => (
            <button key={t.id} onClick={() => setTone(t.id)} style={{ padding: '6px 14px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${tone === t.id ? GOLD : BORDER}`, background: tone === t.id ? `${GOLD}15` : 'transparent', fontSize: 12, color: tone === t.id ? GOLD : 'rgba(255,255,255,0.5)' }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Influencer template */}
      {influencerTemplates.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Style Template <span style={{ color: GOLD, fontWeight: 400 }}>(optional)</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setTemplateId('')} style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${!templateId ? GOLD : BORDER}`, background: !templateId ? `${GOLD}12` : 'transparent', fontSize: 12, color: !templateId ? GOLD : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>My Own Style</button>
            {influencerTemplates.map(t => (
              <button key={t.id} onClick={() => setTemplateId(t.id)} style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${templateId === t.id ? '#818cf8' : BORDER}`, background: templateId === t.id ? 'rgba(129,140,248,0.12)' : 'transparent', fontSize: 12, color: templateId === t.id ? '#818cf8' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                {t.name} <span style={{ opacity: 0.5 }}>·{t.aspiration_score}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topic */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Topic / Theme</div>
        <textarea value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="What do you want to write about? Be specific — e.g. 'Why most startup founders underestimate regulatory risk in fintech'"
          rows={3}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${topic ? GOLD + '60' : BORDER}`, color: 'white', fontSize: 13, lineHeight: 1.5, resize: 'vertical', outline: 'none', fontFamily: "'Inter', system-ui", boxSizing: 'border-box' }}
        />
      </div>

      {error && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={13} />{error}</div>}
      {positioning && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={11} color="#4ade80" /> Writing as <span style={{ color: GOLD }}>{positioning.personal_archetype}</span> archetype · Strategic lock active</div>}

      <button onClick={generate} disabled={generating || !topic.trim()} style={{ width: '100%', padding: '13px', borderRadius: 8, background: generating || !topic.trim() ? 'rgba(201,168,76,0.3)' : GOLD, color: BG, fontWeight: 700, fontSize: 14, border: 'none', cursor: generating || !topic.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {generating ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />Generating…</> : <><Sparkles size={15} />Generate {PLATFORMS.find(p => p.id === platform)?.label}</>}
      </button>
    </div>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────

function ContentCard({ item, onView, onDelete }: { item: ContentItem; onView: (i: ContentItem) => void; onDelete: (id: string) => void }) {
  const preview = item.body.slice(0, 180).replace(/\n/g, ' ');
  const words   = item.body.split(/\s+/).filter(Boolean).length;
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.2s' }}
      onClick={() => onView(item)}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <PlatformIcon id={item.platform} size={14} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || 'Untitled'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {item.nlp_compliance && <NLPBadge compliance={item.nlp_compliance} />}
          <button onClick={e => { e.stopPropagation(); onDelete(item.id); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.2)', borderRadius: 4 }}><Trash2 size={12} /></button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 10 }}>{preview}{preview.length < item.body.length ? '…' : ''}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
        <span style={{ padding: '2px 7px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', textTransform: 'capitalize' }}>{platformLabel(item.platform)}</span>
        <span>{words} words</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <span style={{ marginLeft: 'auto', padding: '2px 7px', borderRadius: 8, background: item.status === 'published' ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)', color: item.status === 'published' ? '#4ade80' : 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>{item.status}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExpressPage() {
  const params   = useParams();
  const router   = useRouter();
  const clientId = params.id as string;

  const [items,               setItems]               = useState<ContentItem[]>([]);
  const [positioning,         setPositioning]         = useState<Positioning | null>(null);
  const [influencerTemplates, setInfluencerTemplates] = useState<InfluencerTemplate[]>([]);
  const [loading,             setLoading]             = useState(true);
  const [viewing,             setViewing]             = useState<ContentItem | null>(null);
  const [activeTab,           setActiveTab]           = useState<'pillars' | 'custom' | 'library'>('pillars');
  const [filter,              setFilter]              = useState<'all' | 'draft' | 'published'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: pos }, { data: content }, { data: templates }] = await Promise.all([
      supabase.from('positioning').select('personal_archetype, business_archetype, positioning_statement, content_pillars, signature_lines').eq('client_id', clientId).maybeSingle(),
      supabase.from('content_items').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
      supabase.from('influencer_profiles').select('id, name, archetype, aspiration_score, content_template, style_adaptation_notes').eq('client_id', clientId).eq('scan_status', 'completed').order('aspiration_score', { ascending: false }),
    ]);
    setPositioning(pos as Positioning ?? null);
    setItems((content ?? []) as ContentItem[]);
    setInfluencerTemplates((templates ?? []) as InfluencerTemplate[]);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function deleteItem(id: string) {
    if (!confirm('Delete this content?')) return;
    await supabase.from('content_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  }
  function onCreated(item: ContentItem) { setItems(prev => [item, ...prev]); }

  const pillars    = positioning?.content_pillars ?? [];
  const filtered   = items.filter(i => filter === 'all' || i.status === filter);
  const hasPillars = pillars.length > 0;

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <RefreshCw size={21} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} /> Loading…
    </div>
  );

  return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {viewing && <ContentViewer item={viewing} onClose={() => setViewing(null)} onDelete={id => { deleteItem(id); setViewing(null); }} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>Express</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Deploy your content strategy · AI-generated · Archetype-aligned</p>
        </div>
        {!positioning && (
          <button onClick={() => router.push(`/dashboard/clients/${clientId}/position`)} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${GOLD}50`, background: `${GOLD}10`, color: GOLD, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <AlertTriangle size={13} /> Complete Position First
          </button>
        )}
      </div>

      {/* No position gate */}
      {!positioning && (
        <div style={{ background: 'rgba(201,168,76,0.06)', border: `1px solid ${GOLD}30`, borderRadius: 12, padding: 24, marginBottom: 24, textAlign: 'center' }}>
          <Target size={32} color={GOLD} style={{ marginBottom: 12, opacity: 0.6 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>Complete POSITION to activate your content strategy</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, maxWidth: 460, margin: '0 auto 16px' }}>
            The Position module assigns your archetype and builds content pillars — Express uses those to generate archetype-aligned content at scale.
          </p>
          <button onClick={() => router.push(`/dashboard/clients/${clientId}/position`)} style={{ padding: '10px 24px', borderRadius: 8, background: GOLD, color: BG, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            Go to Position <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Archetype lock banner */}
      {positioning && (
        <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <CheckCircle size={14} color="#4ade80" />
          <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>Strategic Lock Active</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Writing as <strong style={{ color: 'white' }}>{positioning.personal_archetype}</strong>{positioning.business_archetype ? ` + ${positioning.business_archetype}` : ''}</span>
          {hasPillars && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{pillars.length} content pillars defined</span>}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${BORDER}`, paddingBottom: 0 }}>
        {[
          { id: 'pillars', label: 'Content Pillars', icon: Layers, count: hasPillars ? pillars.length : null, tooltip: 'Deploy from your strategic content pillars' },
          { id: 'custom',  label: 'Custom Content',  icon: Plus,   count: null, tooltip: 'Create content on any topic' },
          { id: 'library', label: 'Library',         icon: LayoutGrid, count: items.length || null, tooltip: 'All generated content' },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} style={{
              padding: '10px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
              background: active ? `${GOLD}12` : 'transparent',
              borderBottom: active ? `2px solid ${GOLD}` : '2px solid transparent',
              color: active ? GOLD : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: active ? 600 : 400,
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 150ms',
            }}>
              <Icon size={13} /> {tab.label}
              {tab.count !== null && <span style={{ padding: '1px 6px', borderRadius: 8, background: active ? `${GOLD}25` : 'rgba(255,255,255,0.08)', fontSize: 11, fontWeight: 600 }}>{tab.count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── PILLARS TAB ── */}
      {activeTab === 'pillars' && (
        <>
          {!hasPillars ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <Layers size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>No content pillars defined</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
                Complete the Position module to have AI define your content pillars based on your archetype and industry.
              </p>
              <button onClick={() => router.push(`/dashboard/clients/${clientId}/position`)} style={{ padding: '10px 22px', borderRadius: 8, background: GOLD, color: BG, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                Go to Position <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.6 }}>
                Your content strategy defines <strong style={{ color: 'white' }}>{pillars.length} pillars</strong> from the Position module.
                Click any pillar to generate content — one-click from a theme, or write your own topic.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pillars.map((pillar, i) => {
                  const pillarContentCount = items.filter(item =>
                    item.title.toLowerCase().includes(pillar.name.toLowerCase()) ||
                    pillar.themes?.some(t => item.title.toLowerCase().includes(t.toLowerCase().slice(0, 15)))
                  ).length;
                  return (
                    <PillarCard
                      key={i}
                      pillar={pillar}
                      index={i}
                      clientId={clientId}
                      positioning={positioning!}
                      influencerTemplates={influencerTemplates}
                      pillarContentCount={pillarContentCount}
                      onCreated={(item) => { onCreated(item); setActiveTab('library'); }}
                    />
                  );
                })}
              </div>

              {/* Influencer templates strip */}
              {influencerTemplates.length > 0 && (
                <div style={{ marginTop: 20, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Style Templates Available</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {influencerTemplates.map(t => (
                      <div key={t.id} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', fontSize: 12, color: '#818cf8' }}>
                        {t.name} · {t.aspiration_score}/100
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>These are available when generating from any pillar above.</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── CUSTOM TAB ── */}
      {activeTab === 'custom' && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color={GOLD} /> Custom Content
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Write content on any topic — still generated with your archetype voice and NLP validation.</p>
          <CustomCreatePanel
            clientId={clientId}
            positioning={positioning}
            influencerTemplates={influencerTemplates}
            onCreated={(item) => { onCreated(item); setActiveTab('library'); }}
          />
        </div>
      )}

      {/* ── LIBRARY TAB ── */}
      {activeTab === 'library' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {(['all', 'draft', 'published'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter === f ? GOLD : BORDER}`, background: filter === f ? `${GOLD}15` : 'transparent', fontSize: 12, color: filter === f ? GOLD : 'rgba(255,255,255,0.4)', cursor: 'pointer', textTransform: 'capitalize' }}>{f}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{filtered.length} items</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <FileText size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>No content yet — generate from a pillar or create custom content.</p>
              <button onClick={() => setActiveTab(hasPillars ? 'pillars' : 'custom')} style={{ marginTop: 16, padding: '9px 20px', borderRadius: 8, background: GOLD, color: BG, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                {hasPillars ? 'Go to Content Pillars' : 'Create Content'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
              {filtered.map(item => <ContentCard key={item.id} item={item} onView={setViewing} onDelete={deleteItem} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
