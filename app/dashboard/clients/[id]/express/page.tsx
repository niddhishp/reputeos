'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus, RefreshCw, AlertTriangle, Copy, CheckCircle,
  Sparkles, FileText, Twitter, Linkedin, BookOpen, Mic, AlignLeft,
  ArrowRight, Pencil, Trash2, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentItem {
  id: string;
  title: string;
  body: string;
  platform: string;
  status: 'draft' | 'published';
  nlp_compliance: Record<string, unknown>;
  created_at: string;
}

interface Positioning {
  personal_archetype: string;
  content_pillars: Array<{ name: string; themes: string[] }>;
}

interface InfluencerTemplate {
  id: string;
  name: string;
  archetype: string;
  aspiration_score: number;
  content_template: string;
  style_adaptation_notes: string;
}

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'linkedin_long',   label: 'LinkedIn Article',  icon: Linkedin,  color: '#0A66C2', desc: '800–1,200 words' },
  { id: 'linkedin_short',  label: 'LinkedIn Post',     icon: Linkedin,  color: '#0A66C2', desc: '150–250 words'   },
  { id: 'twitter_thread',  label: 'X Thread',          icon: Twitter,   color: '#1DA1F2', desc: '10–15 tweets'    },
  { id: 'oped',            label: 'Op-Ed',             icon: FileText,  color: '#fb923c', desc: 'ET / Mint / Bloomberg' },
  { id: 'whitepaper',      label: 'Whitepaper',        icon: BookOpen,  color: '#818cf8', desc: '1,500–2,500 words' },
  { id: 'keynote',         label: 'Keynote Outline',   icon: Mic,       color: '#f472b6', desc: '30-min talk' },
] as const;

const TONES = [
  { id: 'authoritative',  label: 'Authoritative' },
  { id: 'conversational', label: 'Conversational' },
  { id: 'provocative',    label: 'Provocative' },
  { id: 'analytical',     label: 'Analytical' },
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
  const passes = [
    compliance.hasAuthorityMarkers,
    compliance.expertFramePresent,
    compliance.familyFrameAbsent,
  ].filter(Boolean).length;

  const color = passes === 3 ? '#4ade80' : passes === 2 ? GOLD : '#f87171';
  const label = passes === 3 ? 'NLP Compliant' : passes === 2 ? 'Needs review' : 'Non-compliant';

  return (
    <span style={{ padding: '2px 8px', borderRadius: 10, background: `${color}15`, border: `1px solid ${color}40`, fontSize: 11, fontWeight: 600, color }}>
      {label}
    </span>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────

function ContentCard({ item, onView, onDelete }: {
  item: ContentItem;
  onView: (item: ContentItem) => void;
  onDelete: (id: string) => void;
}) {
  const preview = item.body.slice(0, 180).replace(/\n/g, ' ');
  const words   = item.body.split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.2s' }}
      onClick={() => onView(item)}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <PlatformIcon id={item.platform} size={14} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title || 'Untitled'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {item.nlp_compliance && <NLPBadge compliance={item.nlp_compliance} />}
          <button onClick={e => { e.stopPropagation(); onDelete(item.id); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.2)', borderRadius: 4 }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 10 }}>
        {preview}{preview.length < item.body.length ? '…' : ''}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
        <span style={{ padding: '2px 7px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', textTransform: 'capitalize' }}>
          {platformLabel(item.platform)}
        </span>
        <span>{words} words</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={10} />
          {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        <span style={{
          marginLeft: 'auto', padding: '2px 7px', borderRadius: 8,
          background: item.status === 'published' ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
          color: item.status === 'published' ? '#4ade80' : 'rgba(255,255,255,0.3)',
          textTransform: 'capitalize',
        }}>
          {item.status}
        </span>
      </div>
    </div>
  );
}

// ─── Content Viewer ───────────────────────────────────────────────────────────

function ContentViewer({ item, onClose, onDelete }: {
  item: ContentItem; onClose: () => void; onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const compliance = item.nlp_compliance ?? {};
  const words = item.body.split(/\s+/).filter(Boolean).length;

  function copy() {
    navigator.clipboard.writeText(item.body);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 20px', overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#0d1117', border: `1px solid ${BORDER}`, borderRadius: 14, width: '100%', maxWidth: 780, padding: 32 }}>
        {/* Header */}
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
            <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>

        {/* NLP compliance strip */}
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

        {/* Content */}
        <pre style={{
          fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14,
          color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, whiteSpace: 'pre-wrap',
          wordBreak: 'break-word', background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${BORDER}`, borderRadius: 8, padding: 20, maxHeight: '60vh', overflowY: 'auto',
        }}>
          {item.body}
        </pre>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button onClick={() => { onDelete(item.id); onClose(); }} style={{
            padding: '8px 14px', borderRadius: 7, border: '1px solid rgba(248,113,113,0.3)',
            background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Trash2 size={12} /> Delete Draft
          </button>
          <button onClick={copy} style={{
            padding: '9px 18px', borderRadius: 7, background: GOLD, color: '#080C14',
            fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'Copied to clipboard' : 'Copy Content'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Panel ─────────────────────────────────────────────────────────────

function CreatePanel({ clientId, positioning, influencerTemplates, onCreated }: {
  clientId: string;
  positioning: Positioning | null;
  influencerTemplates: InfluencerTemplate[];
  onCreated: (item: ContentItem) => void;
}) {
  const [platform,    setPlatform]    = useState<PlatformId>('linkedin_long');
  const [tone,        setTone]        = useState('authoritative');
  const [topic,       setTopic]       = useState('');
  const [templateId,  setTemplateId]  = useState<string>('');
  const [generating,  setGenerating]  = useState(false);
  const [error,       setError]       = useState('');
  const [result,      setResult]      = useState<ContentItem | null>(null);

  const pillars = positioning?.content_pillars ?? [];

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
      // Build a local ContentItem from response
      const item: ContentItem = {
        id: data.contentId, title: topic.slice(0, 80),
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
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle size={16} color="#4ade80" />
          <span style={{ fontSize: 14, color: '#4ade80', fontWeight: 600 }}>Content generated</span>
          <button onClick={() => setResult(null)} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>
            Generate Another
          </button>
        </div>
        <ContentViewer item={result} onClose={() => setResult(null)} onDelete={() => setResult(null)} />
      </div>
    );
  }

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={16} color={GOLD} /> Create Content
      </h3>

      {/* Platform grid */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Platform</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {PLATFORMS.map(p => {
            const selected = platform === p.id;
            const Icon = p.icon;
            return (
              <button key={p.id} onClick={() => setPlatform(p.id as PlatformId)} style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${selected ? p.color : BORDER}`,
                background: selected ? `${p.color}15` : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={13} color={selected ? p.color : 'rgba(255,255,255,0.4)'} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: selected ? 'white' : 'rgba(255,255,255,0.5)' }}>{p.label}</span>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Voice Tone</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TONES.map(t => (
            <button key={t.id} onClick={() => setTone(t.id)} style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${tone === t.id ? GOLD : BORDER}`,
              background: tone === t.id ? `${GOLD}15` : 'transparent',
              fontSize: 12, color: tone === t.id ? GOLD : 'rgba(255,255,255,0.5)',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Influencer template selector */}
      {influencerTemplates.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Style Template <span style={{ color: GOLD, fontWeight: 400 }}>(optional)</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setTemplateId('')}
              style={{
                padding: '7px 13px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                border: `1px solid ${!templateId ? GOLD : BORDER}`,
                background: !templateId ? `${GOLD}12` : 'transparent',
                color: !templateId ? GOLD : 'rgba(255,255,255,0.4)',
              }}>
              My Own Style
            </button>
            {influencerTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                style={{
                  padding: '7px 13px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                  border: `1px solid ${templateId === t.id ? '#818cf8' : BORDER}`,
                  background: templateId === t.id ? 'rgba(129,140,248,0.12)' : 'transparent',
                  color: templateId === t.id ? '#818cf8' : 'rgba(255,255,255,0.4)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                {t.name}
                <span style={{ fontSize: 10, opacity: 0.6 }}>·{t.aspiration_score}/100</span>
              </button>
            ))}
          </div>
          {templateId && influencerTemplates.find(t => t.id === templateId)?.style_adaptation_notes && (
            <div style={{ marginTop: 10, padding: '9px 12px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
              <span style={{ color: '#818cf8', fontWeight: 600 }}>Adaptation: </span>
              {influencerTemplates.find(t => t.id === templateId)?.style_adaptation_notes}
            </div>
          )}
        </div>
      )}

      {/* Topic input */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Topic / Theme</div>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="What do you want to write about? Be specific — e.g. 'Why most startup founders underestimate regulatory risk in fintech'"
          rows={3}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${topic ? GOLD + '60' : BORDER}`,
            color: 'white', fontSize: 13, lineHeight: 1.5, resize: 'vertical',
            outline: 'none', fontFamily: "'Inter', system-ui", boxSizing: 'border-box',
          }}
        />

        {/* Pillar suggestion chips */}
        {pillars.length > 0 && !topic && (
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginRight: 6 }}>Pillars:</span>
            {pillars.slice(0, 5).map((p, i) => (
              <button key={i} onClick={() => setTopic(p.themes[0] ?? p.name)}
                style={{ padding: '2px 9px', borderRadius: 10, background: `${GOLD}10`, border: `1px solid ${GOLD}30`, fontSize: 11, color: GOLD, cursor: 'pointer', marginRight: 5, marginTop: 4 }}>
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      {positioning && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={11} color="#4ade80" />
          Writing as <span style={{ color: GOLD }}>{positioning.personal_archetype}</span> archetype · Strategic lock active
        </div>
      )}

      <button onClick={generate} disabled={generating || !topic.trim()} style={{
        width: '100%', padding: '13px', borderRadius: 8,
        background: generating || !topic.trim() ? 'rgba(201,168,76,0.3)' : GOLD,
        color: '#080C14', fontWeight: 700, fontSize: 14, border: 'none',
        cursor: generating || !topic.trim() ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {generating
          ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating with AI…</>
          : <><Sparkles size={15} /> Generate {PLATFORMS.find(p => p.id === platform)?.label}</>}
      </button>

      {!positioning && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 10, textAlign: 'center' }}>
          ⚠ Complete POSITION first for archetype-aligned content generation
        </p>
      )}
    </div>
  );
}

// ─── Main Express Page ────────────────────────────────────────────────────────

export default function ExpressPage() {
  const params   = useParams();
  const router   = useRouter();
  const clientId = params.id as string;

  const [items,               setItems]               = useState<ContentItem[]>([]);
  const [positioning,         setPositioning]         = useState<Positioning | null>(null);
  const [influencerTemplates, setInfluencerTemplates] = useState<InfluencerTemplate[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<'all' | 'draft' | 'published'>('all');
  const [viewing,     setViewing]     = useState<ContentItem | null>(null);
  const [showCreate,  setShowCreate]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: pos }, { data: content }, { data: templates }] = await Promise.all([
      supabase.from('positioning').select('personal_archetype, content_pillars').eq('client_id', clientId).maybeSingle(),
      supabase.from('content_items').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
      supabase.from('influencer_profiles').select('id, name, archetype, aspiration_score, content_template, style_adaptation_notes')
        .eq('client_id', clientId).eq('scan_status', 'completed').order('aspiration_score', { ascending: false }),
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

  function onCreated(item: ContentItem) {
    setItems(prev => [item, ...prev]);
    setShowCreate(false);
    setTimeout(() => setShowCreate(true), 100); // reset create panel
  }

  const filtered = items.filter(i => filter === 'all' || i.status === filter);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <RefreshCw size={21} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} /> Loading…
    </div>
  );

  return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>
      {viewing && <ContentViewer item={viewing} onClose={() => setViewing(null)} onDelete={id => { deleteItem(id); setViewing(null); }} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>Express</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>AI content generation · Archetype-aligned · NLP validated</p>
        </div>
        {!positioning && (
          <button onClick={() => router.push(`/dashboard/clients/${clientId}/position`)} style={{
            padding: '9px 16px', borderRadius: 8, border: `1px solid ${GOLD}50`,
            background: `${GOLD}10`, color: GOLD, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
          }}>
            <AlertTriangle size={13} /> Complete Position First
          </button>
        )}
      </div>

      {/* Create panel */}
      {showCreate && (
        <CreatePanel
          clientId={clientId}
          positioning={positioning}
          influencerTemplates={influencerTemplates}
          onCreated={onCreated}
        />
      )}

      {/* Content library */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Content Library <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: 12 }}>({items.length})</span>
          </h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'draft', 'published'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${filter === f ? GOLD : BORDER}`,
                background: filter === f ? `${GOLD}15` : 'transparent',
                fontSize: 12, color: filter === f ? GOLD : 'rgba(255,255,255,0.4)',
                textTransform: 'capitalize',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.3)' }}>
            <FileText size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>No content yet — generate your first piece above.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {filtered.map(item => (
              <ContentCard key={item.id} item={item} onView={setViewing} onDelete={deleteItem} />
            ))}
          </div>
        )}
      </div>

      {/* CTA to Validate */}
      {items.length >= 3 && (
        <div style={{
          marginTop: 24, background: `linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(13,17,23,0.5) 100%)`,
          border: `1px solid ${BORDER}`, borderRadius: 12, padding: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 }}>Measure your LSI improvement</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Run a new scan and compare before/after scores with statistical significance.</p>
          </div>
          <button onClick={() => router.push(`/dashboard/clients/${clientId}/validate`)} style={{
            padding: '10px 20px', borderRadius: 8, background: GOLD, color: '#080C14',
            fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
          }}>
            Go to Validate <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
