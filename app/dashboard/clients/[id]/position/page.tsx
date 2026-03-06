'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Sparkles, RefreshCw, AlertTriangle, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, ArrowRight,
  Award, Users, Eye, Target, AlertCircle, CheckCircle,
  BarChart3, Copy, Check, BookOpen, Crown, Flame, Zap, Shield, Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD   = '#C9A84C';
const BG     = '#080C14';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';
const MUTED  = 'rgba(255,255,255,0.38)';
const TEXT   = 'rgba(255,255,255,0.80)';
const RED    = '#ef4444';
const GREEN  = '#4ade80';

const ARCHETYPE_META: Record<string, { color: string; glow: string; symbol: string; element: string; essence: string }> = {
  sage:      { color: '#818cf8', glow: '#818cf820', symbol: '◈', element: 'Ether',  essence: 'The Illuminator'  },
  hero:      { color: '#f59e0b', glow: '#f59e0b20', symbol: '⚡', element: 'Fire',   essence: 'The Champion'    },
  explorer:  { color: '#34d399', glow: '#34d39920', symbol: '◎', element: 'Wind',   essence: 'The Pathfinder'  },
  rebel:     { color: '#f43f5e', glow: '#f43f5e20', symbol: '⊗', element: 'Storm',  essence: 'The Disruptor'   },
  magician:  { color: '#a78bfa', glow: '#a78bfa20', symbol: '✦', element: 'Arcane', essence: 'The Transformer' },
  caregiver: { color: '#fb7185', glow: '#fb718520', symbol: '♡', element: 'Water',  essence: 'The Nurturer'    },
  creator:   { color: '#f97316', glow: '#f9731620', symbol: '◇', element: 'Earth',  essence: 'The Maker'       },
  ruler:     { color: '#eab308', glow: '#eab30820', symbol: '♛', element: 'Gold',   essence: 'The Sovereign'   },
  jester:    { color: '#22d3ee', glow: '#22d3ee20', symbol: '◈', element: 'Air',    essence: 'The Alchemist'   },
  lover:     { color: '#ec4899', glow: '#ec489920', symbol: '◆', element: 'Rose',   essence: 'The Connector'   },
  everyman:  { color: '#94a3b8', glow: '#94a3b820', symbol: '○', element: 'Clay',   essence: 'The Anchor'      },
  innocent:  { color: '#a3e635', glow: '#a3e63520', symbol: '✿', element: 'Light',  essence: 'The Optimist'    },
};

function getArchetypeMeta(name: string) {
  const key = name.toLowerCase().replace(/^the\s+/i, '').trim().split(/\s+/)[0];
  return ARCHETYPE_META[key] || { color: GOLD, glow: `${GOLD}20`, symbol: '◈', element: 'Spirit', essence: 'The Leader' };
}

interface WhyReason      { reason: string; evidence: string }
interface NamedLeader    { name: string; domain: string; archetype_expression: string; what_to_emulate: string }
interface CautionaryTale { name: string; what_happened: string; archetype_failure: string; lesson: string }
interface PeerLSIRow     { name: string; role: string; estimated_lsi: number; visibility: string; archetype: string }
interface Transition     { name: string; industry?: string; before?: string; after?: string; how_long?: string; key_move?: string; what_happened?: string; root_cause?: string; consequence?: string; lesson?: string }
interface ArchetypeReveal {
  why_this_archetype:    WhyReason[];
  archetype_strengths:   Array<{ title: string; description: string }>;
  archetype_shadows:     Array<{ title: string; description: string }>;
  named_leaders:         NamedLeader[];
  cautionary_tales:      CautionaryTale[];
  peer_lsi_comparison:   PeerLSIRow[];
  peer_average_lsi:      number;
  transition_success:    Transition;
  transition_failure:    Transition;
}
interface Positioning {
  id: string; client_id: string; mode: string;
  personal_archetype: string; business_archetype?: string;
  archetype_confidence: number; followability_score: number;
  followability_factors: Record<string, number>;
  positioning_statement: string;
  content_pillars: Array<{ name: string; themes: string[]; frequency: string; formats: string[] }>;
  signature_lines: string[];
  root_cause_insights?: string[];
  archetype_reveal?: ArchetypeReveal;
  updated_at: string;
}
interface Client { name: string; industry: string; role: string; company: string; baseline_lsi: number }

function Pill({ label, color = GOLD }: { label: string; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', background: `${color}18`, border: `1px solid ${color}35`, color }}>
      {label}
    </span>
  );
}

function SCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px 32px', ...style }}>{children}</div>;
}

function SectionHead({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: sub ? 5 : 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${GOLD}15`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={GOLD} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0 }}>{title}</h3>
      </div>
      {sub && <p style={{ fontSize: 12, color: MUTED, margin: '0 0 0 38px' }}>{sub}</p>}
    </div>
  );
}

function HeroReveal({ pos, client, lsi }: { pos: Positioning; client: Client; lsi: number }) {
  const meta = getArchetypeMeta(pos.personal_archetype);
  return (
    <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: `linear-gradient(135deg, ${BG} 0%, #0a0f1a 50%, ${BG} 100%)`, border: `1px solid ${meta.color}30`, padding: '60px 48px', boxShadow: `0 0 80px ${meta.glow}, inset 0 0 80px ${meta.glow}` }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, background: `radial-gradient(ellipse 70% 70% at 80% 50%, ${meta.color} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', border: `1px solid ${meta.color}12`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10, fontWeight: 700 }}>Strategic Archetype Assignment</div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>{client.name} · {client.role} · {client.company}</div>
          <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 900, margin: 0, lineHeight: 1, color: meta.color, textShadow: `0 0 40px ${meta.color}60`, letterSpacing: '-0.02em' }}>
            <span style={{ fontSize: '0.45em', color: MUTED, fontWeight: 400, display: 'block', marginBottom: 6 }}>You are</span>
            {pos.personal_archetype}
          </h1>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Pill label={meta.essence} color={meta.color} />
            <Pill label={`${meta.element} element`} color={meta.color} />
            {pos.business_archetype && <Pill label={pos.business_archetype} color={GOLD} />}
          </div>
          <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.75, marginTop: 20, maxWidth: 560 }}>{pos.positioning_statement}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 176 }}>
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 64, color: meta.color, textShadow: `0 0 30px ${meta.color}80`, lineHeight: 1 }}>{meta.symbol}</div>
          </div>
          {[
            { label: 'Confidence', value: `${pos.archetype_confidence}%`, color: meta.color },
            { label: 'Followability', value: `${pos.followability_score}%`, color: pos.followability_score >= 70 ? GREEN : pos.followability_score >= 55 ? GOLD : RED },
            ...(lsi > 0 ? [{ label: 'Your LSI', value: `${lsi}`, color: lsi >= 70 ? GREEN : lsi >= 50 ? GOLD : RED }] : []),
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 12, padding: '14px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhySection({ reveal, archetype }: { reveal: ArchetypeReveal; archetype: string }) {
  const meta = getArchetypeMeta(archetype);
  return (
    <SCard>
      <SectionHead icon={Target} title="Why You Are This Archetype" sub="5 signals from your digital footprint that confirm this assignment" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(reveal.why_this_archetype ?? []).map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 14, padding: '16px 18px', background: i === 0 ? `${meta.color}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${i === 0 ? `${meta.color}25` : BORDER}`, borderRadius: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${meta.color}15`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: meta.color }}>0{i + 1}</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 5px', lineHeight: 1.4 }}>{r.reason}</p>
              <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.6 }}><span style={{ color: `${meta.color}80`, fontWeight: 600 }}>Evidence: </span>{r.evidence}</p>
            </div>
          </div>
        ))}
      </div>
    </SCard>
  );
}

function StrengthsShadows({ reveal, archetype }: { reveal: ArchetypeReveal; archetype: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <SCard style={{ borderColor: `${GREEN}25` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${GREEN}15`, border: `1px solid ${GREEN}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={14} color={GREEN} /></div>
          <div><h3 style={{ fontSize: 14, fontWeight: 800, color: GREEN, margin: 0 }}>Archetype Strengths</h3><p style={{ fontSize: 11, color: MUTED, margin: 0 }}>What this archetype unlocks for you</p></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(reveal.archetype_strengths ?? []).map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', background: `${GREEN}06`, border: `1px solid ${GREEN}18`, borderRadius: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <CheckCircle size={13} color={GREEN} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 3px' }}>{s.title}</p>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.6 }}>{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SCard>
      <SCard style={{ borderColor: 'rgba(251,191,36,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={14} color="#fbbf24" /></div>
          <div><h3 style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24', margin: 0 }}>Jungian Shadow</h3><p style={{ fontSize: 11, color: MUTED, margin: 0 }}>Blind spots to consciously guard against</p></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(reveal.archetype_shadows ?? []).map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.14)', borderRadius: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertCircle size={13} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 3px' }}>{s.title}</p>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.6 }}>{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SCard>
    </div>
  );
}

function Leaders({ reveal, archetype }: { reveal: ArchetypeReveal; archetype: string }) {
  const meta = getArchetypeMeta(archetype);
  return (
    <SCard>
      <SectionHead icon={Crown} title="Next-Gen Leaders In Your Archetype" sub="Real executives who have mastered this position — study their playbook" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {(reveal.named_leaders ?? []).map((l, i) => (
          <div key={i} style={{ padding: '18px 18px', background: i === 0 ? `${meta.color}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${i === 0 ? `${meta.color}30` : BORDER}`, borderRadius: 14, position: 'relative' }}>
            {i === 0 && <Star size={11} color={meta.color} fill={meta.color} style={{ position: 'absolute', top: 12, right: 12 }} />}
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${meta.color}20`, border: `1px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: meta.color, marginBottom: 12 }}>
              {l.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'white', margin: '0 0 3px' }}>{l.name}</p>
            <p style={{ fontSize: 11, color: MUTED, margin: '0 0 10px' }}>{l.domain}</p>
            <p style={{ fontSize: 12, color: TEXT, margin: '0 0 10px', lineHeight: 1.5 }}>{l.archetype_expression}</p>
            <div style={{ padding: '7px 10px', background: `${GOLD}08`, borderRadius: 7, border: `1px solid ${GOLD}18` }}>
              <span style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>EMULATE: </span>
              <span style={{ fontSize: 11, color: TEXT }}>{l.what_to_emulate}</span>
            </div>
          </div>
        ))}
      </div>
    </SCard>
  );
}

function PeerLSI({ reveal, clientLSI, archetype }: { reveal: ArchetypeReveal; clientLSI: number; archetype: string }) {
  const meta  = getArchetypeMeta(archetype);
  const peers = reveal.peer_lsi_comparison ?? [];
  const avg   = reveal.peer_average_lsi ?? 0;
  const gap   = avg - clientLSI;

  const rows = [
    { name: 'You', role: 'Your current score', estimated_lsi: clientLSI, visibility: clientLSI >= 70 ? 'High' : clientLSI >= 50 ? 'Medium' : 'Low', archetype, isYou: true },
    ...peers.map(p => ({ ...p, isYou: false })),
  ].sort((a, b) => b.estimated_lsi - a.estimated_lsi);

  return (
    <SCard>
      <SectionHead icon={BarChart3} title="Comparative LSI Scores" sub="How you compare to named peers in your industry" />
      {gap > 0 && clientLSI > 0 && (
        <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrendingDown size={18} color={RED} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: RED, margin: '0 0 2px' }}>You are {gap} points below your peer average ({avg}/100)</p>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Every point gap is measurable lost opportunity in media, investment, and influence.</p>
          </div>
        </div>
      )}
      {gap <= 0 && clientLSI > 0 && (
        <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrendingUp size={18} color={GREEN} />
          <p style={{ fontSize: 14, fontWeight: 700, color: GREEN, margin: 0 }}>You are {Math.abs(gap)} points above your peer average. Protect and extend this lead.</p>
        </div>
      )}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 70px 90px 1.5fr', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${BORDER}` }}>
          {['Name', 'Role', 'LSI', 'Visibility', 'Archetype'].map(h => (
            <span key={h} style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{h}</span>
          ))}
        </div>
        {rows.map((row, i) => {
          const lsiCol = row.estimated_lsi >= 70 ? GREEN : row.estimated_lsi >= 50 ? GOLD : RED;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 70px 90px 1.5fr', padding: '13px 16px', background: row.isYou ? `${meta.color}08` : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)', borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : 'none', borderLeft: row.isYou ? `3px solid ${meta.color}` : '3px solid transparent' }}>
              <span style={{ fontSize: 13, fontWeight: row.isYou ? 800 : 600, color: row.isYou ? meta.color : 'white' }}>{row.isYou ? '★ ' : ''}{row.name}</span>
              <span style={{ fontSize: 12, color: MUTED }}>{row.role}</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: lsiCol }}>{row.estimated_lsi}</span>
              <span><span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: row.visibility === 'High' ? `${GREEN}15` : row.visibility === 'Medium' ? `${GOLD}15` : `${RED}15`, color: row.visibility === 'High' ? GREEN : row.visibility === 'Medium' ? GOLD : RED }}>{row.visibility}</span></span>
              <span style={{ fontSize: 11, color: MUTED }}>{row.archetype}</span>
            </div>
          );
        })}
      </div>
    </SCard>
  );
}

function Transitions({ reveal }: { reveal: ArchetypeReveal }) {
  const success = reveal.transition_success;
  const failure = reveal.transition_failure;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {success?.name && (
        <SCard style={{ borderColor: `${GREEN}22` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${GREEN}15`, border: `1px solid ${GREEN}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={13} color={GREEN} /></div>
            <div><p style={{ fontSize: 10, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: 0 }}>The Successful Transition</p><p style={{ fontSize: 11, color: MUTED, margin: 0 }}>How reputation engineering changed everything</p></div>
          </div>
          <div style={{ padding: '14px 16px', background: `${GREEN}06`, border: `1px solid ${GREEN}14`, borderRadius: 10, marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: GREEN, margin: '0 0 2px' }}>{success.name}</p>
            {success.industry && <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{success.industry}</p>}
          </div>
          {success.before && <div style={{ marginBottom: 8 }}><span style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Before</span><p style={{ fontSize: 12, color: TEXT, margin: '3px 0 0', lineHeight: 1.6 }}>{success.before}</p></div>}
          {success.after  && <div style={{ marginBottom: 10 }}><span style={{ fontSize: 10, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>After</span><p style={{ fontSize: 12, color: TEXT, margin: '3px 0 0', lineHeight: 1.6 }}>{success.after}</p></div>}
          {success.key_move && <div style={{ padding: '9px 11px', background: `${GOLD}08`, border: `1px solid ${GOLD}18`, borderRadius: 7 }}><span style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>KEY MOVE: </span><span style={{ fontSize: 11, color: TEXT }}>{success.key_move}</span></div>}
          {success.how_long && <p style={{ fontSize: 11, color: MUTED, margin: '8px 0 0' }}>Timeframe: {success.how_long}</p>}
        </SCard>
      )}
      <SCard style={{ borderColor: `${RED}22` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${RED}15`, border: `1px solid ${RED}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Flame size={13} color={RED} /></div>
          <div><p style={{ fontSize: 10, color: RED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: 0 }}>Cautionary Tales</p><p style={{ fontSize: 11, color: MUTED, margin: 0 }}>What reputation neglect looks like in this archetype</p></div>
        </div>
        {[...(reveal.cautionary_tales ?? []), ...(failure?.name ? [{ name: failure.name, what_happened: failure.what_happened ?? '', archetype_failure: failure.root_cause ?? '', lesson: failure.lesson ?? '' }] : [])].map((t, i) => (
          <div key={i} style={{ padding: '14px 16px', background: `${RED}05`, border: `1px solid ${RED}18`, borderRadius: 10, marginBottom: i < 1 ? 10 : 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#fca5a5', margin: '0 0 5px' }}>{t.name}</p>
            <p style={{ fontSize: 12, color: TEXT, margin: '0 0 6px', lineHeight: 1.6 }}>{t.what_happened}</p>
            {t.archetype_failure && <p style={{ fontSize: 11, color: MUTED, margin: '0 0 8px', lineHeight: 1.5 }}><span style={{ color: `${RED}80`, fontWeight: 600 }}>Failure: </span>{t.archetype_failure}</p>}
            {t.lesson && <div style={{ padding: '7px 10px', background: `${GOLD}08`, border: `1px solid ${GOLD}15`, borderRadius: 7 }}><span style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>LESSON: </span><span style={{ fontSize: 11, color: TEXT }}>{t.lesson}</span></div>}
          </div>
        ))}
      </SCard>
    </div>
  );
}

function Followability({ pos, archetype }: { pos: Positioning; archetype: string }) {
  const meta    = getArchetypeMeta(archetype);
  const factors = pos.followability_factors ?? {};
  const labels: Record<string, string> = { uniqueness: 'Archetype Uniqueness', emotionalResonance: 'Emotional Resonance', contentOpportunity: 'Content Opportunity', platformFit: 'Platform Fit', historicalPerformance: 'Peer Performance' };
  return (
    <SCard>
      <SectionHead icon={Users} title="Followability Score Breakdown" sub="The 5 factors driving your predicted audience growth" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ textAlign: 'center', padding: '28px 20px', background: `${meta.color}08`, border: `1px solid ${meta.color}25`, borderRadius: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: meta.color, lineHeight: 1, textShadow: `0 0 30px ${meta.color}60` }}>{pos.followability_score}</div>
            <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 5 }}>Out of 100</div>
          </div>
          <p style={{ fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 1.6 }}>
            {pos.followability_score >= 75 ? 'Strong audience growth potential. Execute the content pillars consistently.' : pos.followability_score >= 55 ? 'Good foundation. 2–3 improvements can push this above 75.' : 'Significant upside. Right positioning changes the trajectory fast.'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
          {Object.entries(factors).map(([key, val]) => {
            const v = typeof val === 'number' ? val : 0;
            const color = v >= 70 ? GREEN : v >= 50 ? GOLD : RED;
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: TEXT }}>{labels[key] || key}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{v}%</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${v}%`, background: color, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SCard>
  );
}

function Insights({ pos }: { pos: Positioning }) {
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <SCard>
        <SectionHead icon={AlertTriangle} title="Root Cause Insights" sub="Why your reputation is where it is today" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {(pos.root_cause_insights ?? []).map((insight, i) => (
            <div key={i} style={{ padding: '11px 13px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 9, display: 'flex', gap: 9 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: 'rgba(251,191,36,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24' }}>{i + 1}</span>
              </div>
              <p style={{ fontSize: 12, color: TEXT, margin: 0, lineHeight: 1.6 }}>{insight}</p>
            </div>
          ))}
        </div>
      </SCard>
      <SCard>
        <SectionHead icon={Sparkles} title="Signature Lines" sub="Use across LinkedIn, bio, and introductions" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(pos.signature_lines ?? []).map((line, i) => (
            <div key={i} style={{ padding: '11px 13px', background: `${GOLD}06`, border: `1px solid ${GOLD}18`, borderRadius: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.5, flex: 1 }}>{line}</p>
              <button onClick={() => { navigator.clipboard.writeText(line); setCopied(i); setTimeout(() => setCopied(null), 2000); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px', color: MUTED, flexShrink: 0 }}>
                {copied === i ? <Check size={13} color={GREEN} /> : <Copy size={13} />}
              </button>
            </div>
          ))}
        </div>
      </SCard>
    </div>
  );
}

function Pillars({ pos, archetype }: { pos: Positioning; archetype: string }) {
  const meta  = getArchetypeMeta(archetype);
  const [open, setOpen] = useState<number | null>(0);
  return (
    <SCard>
      <SectionHead icon={BookOpen} title="Your 5 Content Pillars" sub="The strategic framework for all your content — create each in Express" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(pos.content_pillars ?? []).map((p, i) => (
          <div key={i} style={{ border: `1px solid ${open === i ? `${meta.color}35` : BORDER}`, borderRadius: 12, overflow: 'hidden', background: open === i ? `${meta.color}05` : 'transparent' }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${meta.color}15`, border: `1px solid ${meta.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: meta.color }}>P{i + 1}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0' }}>{p.frequency} · {(p.formats ?? []).slice(0, 2).join(', ')}</p>
              </div>
              {open === i ? <ChevronUp size={14} color={MUTED} /> : <ChevronDown size={14} color={MUTED} />}
            </button>
            {open === i && (
              <div style={{ padding: '0 16px 14px 54px', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {(p.themes ?? []).map((t: string, ti: number) => (
                  <span key={ti} style={{ padding: '4px 9px', borderRadius: 7, fontSize: 11, background: `${meta.color}12`, border: `1px solid ${meta.color}22`, color: meta.color }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </SCard>
  );
}

function EmptyCTA({ clientName, onAssign, assigning, error }: { clientName: string; onAssign: () => void; assigning: boolean; error: string }) {
  return (
    <div style={{ maxWidth: 640, margin: '80px auto 0', textAlign: 'center' }}>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
      <div style={{ fontSize: 72, animation: 'float 3s ease-in-out infinite', marginBottom: 24, color: GOLD, textShadow: `0 0 40px ${GOLD}60` }}>◈</div>
      <p style={{ fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 14 }}>Strategic Archetype Assignment</p>
      <h1 style={{ fontSize: 34, fontWeight: 900, color: 'white', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Discover Your<br /><span style={{ color: GOLD }}>Strategic Identity</span></h1>
      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, margin: '0 0 36px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
        AI reads your complete digital footprint and assigns one of 26 strategic archetypes — with a breakdown of why, what it means, who else operates from this position, and exactly what to do next.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 36, textAlign: 'left' }}>
        {[{ icon: Target, label: 'Archetype Reveal', desc: '5 reasons from your scan data' }, { icon: Users, label: 'Named Leaders', desc: 'Who else plays this role globally' }, { icon: BarChart3, label: 'LSI Comparison', desc: 'You vs named peers in your sector' }].map(({ icon: Icon, label, desc }) => (
          <div key={label} style={{ padding: '14px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
            <Icon size={15} color={GOLD} style={{ marginBottom: 7 }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: '0 0 3px' }}>{label}</p>
            <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>
      {error && <p style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button onClick={onAssign} disabled={assigning} style={{ padding: '15px 40px', background: GOLD, color: '#080C14', fontWeight: 900, fontSize: 15, borderRadius: 11, border: 'none', cursor: assigning ? 'not-allowed' : 'pointer', opacity: assigning ? 0.7 : 1 }}>
        {assigning ? 'Analysing…' : 'Reveal My Archetype →'}
      </button>
    </div>
  );
}

export default function PositionPage() {
  const { id: clientId } = useParams() as { id: string };
  const [client,      setClient]      = useState<Client | null>(null);
  const [positioning, setPositioning] = useState<Positioning | null>(null);
  const [lsiScore,    setLsiScore]    = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [assigning,   setAssigning]   = useState(false);
  const [error,       setError]       = useState('');

  const load = useCallback(async () => {
    const [{ data: cl }, { data: pos }, { data: lsiRun }] = await Promise.all([
      supabase.from('clients').select('name,industry,role,company,baseline_lsi').eq('id', clientId).maybeSingle(),
      supabase.from('positioning').select('*').eq('client_id', clientId).maybeSingle(),
      supabase.from('lsi_runs').select('total_score').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (cl) setClient(cl as Client);
    if (pos) setPositioning(pos as Positioning);
    if (lsiRun) setLsiScore(lsiRun.total_score ?? 0);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function assign() {
    setAssigning(true); setError('');
    try {
      const res  = await fetch('/api/archetype/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId }), signal: AbortSignal.timeout(130_000) });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Assignment failed');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Assignment failed'); }
    finally { setAssigning(false); }
  }

  if (loading) return <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: 32 }}>◈</div>;

  if (assigning) return (
    <div style={{ background: BG, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', border: `2px solid ${GOLD}20`, position: 'absolute' }} />
        <div style={{ width: 72, height: 72, borderRadius: '50%', border: `2px solid transparent`, borderTopColor: GOLD, position: 'absolute', animation: 'spin 1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: GOLD }}>◈</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 5px' }}>Analysing {client?.name ?? ''}…</p>
        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>AI is reading your digital footprint and assigning your strategic identity</p>
      </div>
    </div>
  );

  if (!positioning) return (
    <div style={{ background: BG, minHeight: '100vh', padding: '40px 32px' }}>
      <EmptyCTA clientName={client?.name ?? ''} onAssign={assign} assigning={assigning} error={error} />
    </div>
  );

  const reveal = positioning.archetype_reveal;

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '32px 32px 80px', fontFamily: "'Inter', system-ui, sans-serif", color: 'white' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} * { box-sizing: border-box; }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, animation: 'fadeUp 0.4s ease' }}>
        <div>
          <p style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 3px' }}>Position</p>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0 }}>Strategic Positioning</h2>
        </div>
        <button onClick={assign} disabled={assigning} style={{ padding: '9px 15px', background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 8, color: GOLD, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <RefreshCw size={12} /> Reassign
        </button>
      </div>
      {error && <div style={{ marginBottom: 18, padding: '12px 15px', background: `${RED}12`, border: `1px solid ${RED}28`, borderRadius: 9, fontSize: 13, color: '#fca5a5' }}><AlertTriangle size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.5s ease' }}>
        <HeroReveal pos={positioning} client={client!} lsi={lsiScore} />
        {(reveal?.why_this_archetype?.length ?? 0) > 0       && <WhySection         reveal={reveal!}  archetype={positioning.personal_archetype} />}
        {((reveal?.archetype_strengths?.length ?? 0) > 0 ||
          (reveal?.archetype_shadows?.length ?? 0)   > 0)    && <StrengthsShadows   reveal={reveal!} archetype={positioning.personal_archetype} />}
        {(reveal?.named_leaders?.length ?? 0) > 0             && <Leaders            reveal={reveal!}  archetype={positioning.personal_archetype} />}
        {(reveal?.peer_lsi_comparison?.length ?? 0) > 0       && <PeerLSI            reveal={reveal!}  clientLSI={lsiScore} archetype={positioning.personal_archetype} />}
        <Followability pos={positioning} archetype={positioning.personal_archetype} />
        {((reveal?.cautionary_tales?.length ?? 0) > 0 ||
          reveal?.transition_success?.name)            && <Transitions        reveal={reveal!} />}
        <Insights   pos={positioning} />
        <Pillars    pos={positioning} archetype={positioning.personal_archetype} />
        <div style={{ padding: '30px 34px', background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(8,12,20,0) 100%)', border: `1px solid ${GOLD}28`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18 }}>
          <div>
            <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7 }}>Position Complete — What's Next?</div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: 'white', margin: '0 0 5px' }}>Start Creating Content</h3>
            <p style={{ fontSize: 13, color: MUTED, margin: 0, maxWidth: 460 }}>Your archetype is locked. Every piece of content in Express will align to this strategic identity — AI generates content in your exact voice and tone.</p>
          </div>
          <a href={`/dashboard/clients/${clientId}/express`} style={{ padding: '13px 26px', background: GOLD, color: '#080C14', fontWeight: 800, fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
            Create Content for This Position →
          </a>
        </div>
      </div>
    </div>
  );
}
