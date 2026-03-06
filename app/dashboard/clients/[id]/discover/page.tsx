'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  Search, RefreshCw, AlertTriangle, CheckCircle, Eye,
  TrendingUp, Shield, Users, Globe, FileText, Zap,
  ChevronDown, ChevronUp, Target, BarChart2, Activity,
  Award, Briefcase, Calendar, Radio, MessageSquare,
} from 'lucide-react';
import type { DiscoveryReport } from '@/app/api/discover/sources/discovery-report-prompt';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BG     = '#080C14';
const BORDER = 'rgba(201,168,76,0.15)';
const MUTED  = 'rgba(255,255,255,0.35)';
const DIM    = 'rgba(255,255,255,0.07)';
const TEXT   = 'rgba(255,255,255,0.65)';

// ── Shared primitives ──────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px 32px', ...style }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, label, sub, color = GOLD }: {
  icon: React.ElementType; label: string; sub?: string; color?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{label}</h3>
        {sub && <p style={{ fontSize: 11, color: MUTED, margin: 0, marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
  );
}

function Badge({ text, color = GOLD }: { text: string; color?: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${color}18`, border: `1px solid ${color}40`, color }}>
      {text}
    </span>
  );
}

function Bar({ label, value, color, max = 100 }: { label: string; value: number; color: string; max?: number }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: TEXT }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function Quote({ text, color = GOLD }: { text: string; color?: string }) {
  return (
    <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.75, margin: 0, paddingLeft: 16, borderLeft: `3px solid ${color}` }}>
      {text}
    </p>
  );
}

function InsightBox({ icon: Icon = Zap, text, color = GOLD }: { icon?: React.ElementType; text: string; color?: string }) {
  return (
    <div style={{ background: `${color}07`, border: `1px solid ${color}28`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 14 }}>
      <Icon size={14} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{ fontSize: 13, fontWeight: 500, color, margin: 0, lineHeight: 1.65 }}>{text}</p>
    </div>
  );
}

function severityColors(sev: string) {
  if (sev === 'High')          return { bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.35)', text: '#f87171' };
  if (sev === 'Moderate-High') return { bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.35)',  text: '#fb923c' };
  if (sev === 'Moderate')      return { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.3)',   text: '#fbbf24' };
  return                              { bg: 'rgba(74,222,128,0.07)',  border: 'rgba(74,222,128,0.28)',  text: '#4ade80' };
}

// ── Section components ─────────────────────────────────────────────────────

function S1_ProfileOverview({ r }: { r: DiscoveryReport }) {
  const p = r.profile_overview;
  if (!p) return (<>  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>Analysing… this section will appear shortly.</span>
    </div>
  </Card></>);
  
  const scoreColor = p.digital_presence_score >= 65 ? '#4ade80' : p.digital_presence_score >= 40 ? GOLD : '#fb923c';
  const fields = [
    { label: 'Current Position',    value: p.current_position },
    { label: 'Currently Known For', value: p.currently_known_for },
    { label: 'Primary Role',        value: p.primary_role },
    { label: 'Primary Context',     value: p.primary_context },
    { label: 'Age / Generation',    value: p.age_generation },
    { label: 'Location',            value: p.location },
  ];
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, gap: 20 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Identity Headline</p>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: 'white', lineHeight: 1.3, margin: 0 }}>{p.identity_headline}</h2>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0, background: DIM, border: `1px solid ${scoreColor}30`, borderRadius: 12, padding: '14px 20px' }}>
          <div style={{ fontSize: 38, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{p.digital_presence_score}</div>
          <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Digital Presence</div>
          <div style={{ fontSize: 10, color: scoreColor, fontWeight: 600 }}>out of 100</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {fields.map(({ label, value }) => (
          <div key={label} style={{ background: DIM, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: `${GOLD}06`, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 16px' }}>
        <span style={{ fontSize: 12, color: MUTED }}>Digital Presence Assessment: </span>
        <span style={{ fontSize: 12, color: TEXT }}>{p.digital_presence_narrative}</span>
      </div>
    </Card>
  );
}

function S2_ProfessionalBackground({ r }: { r: DiscoveryReport }) {
  const pb = r.professional_background;
  if (!pb) return (<>  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>Analysing… this section will appear shortly.</span>
    </div>
  </Card></>);
  
  return (
    <Card>
      <SectionHeader icon={Briefcase} label="Professional Background" />
      <Quote text={pb.summary} />
      <div style={{ margin: '22px 0' }}>
        <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Leadership Trajectory</p>
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: `${GOLD}25`, borderRadius: 1 }} />
          {(pb.trajectory ?? []).map((t, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 18 }}>
              <div style={{ position: 'absolute', left: -24, top: 4, width: 14, height: 14, borderRadius: '50%', border: `2px solid ${GOLD}`, background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
              </div>
              <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, marginBottom: 3 }}>{t.year}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 2 }}>{t.milestone}</div>
              <div style={{ fontSize: 12, color: MUTED }}>{t.significance}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Key Achievements</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(pb.key_achievements ?? []).map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Award size={12} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: TEXT }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Education & Recognition</p>
          {pb.education && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Education</div>
              <div style={{ fontSize: 12, color: TEXT }}>{pb.education}</div>
            </div>
          )}
          <div style={{ fontSize: 10, color: MUTED, marginBottom: 6 }}>Awards & Recognition</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(pb.awards_recognition ?? []).map((a, i) => (
              <span key={i} style={{ fontSize: 12, color: TEXT }}>· {a}</span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function S3_RecentDevelopments({ r }: { r: DiscoveryReport }) {
  const rd = r.recent_developments;
  if (!rd) return (<>  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>Analysing… this section will appear shortly.</span>
    </div>
  </Card></>);
  
  return (
    <Card>
      <SectionHeader icon={Calendar} label="Recent Developments & News Context" />
      <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}25`, borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Major Recent Event</div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.6 }}>{rd.major_recent_event}</p>
      </div>
      <Quote text={rd.strategic_context} />
      {rd.news_items?.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>News Items</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rd.news_items.map((n, i) => (
              <div key={i} style={{ background: DIM, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 3 }}>{n.headline}</div>
                <div style={{ fontSize: 11, color: MUTED, marginBottom: 3 }}>{n.source}</div>
                <div style={{ fontSize: 11, color: TEXT }}>{n.significance}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function S4_SearchReputation({ r }: { r: DiscoveryReport }) {
  const sr = r.search_reputation;
  if (!sr) return (<>  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>Analysing… this section will appear shortly.</span>
    </div>
  </Card></>);
  
  const colors = [GOLD, '#60a5fa', '#4ade80', '#a78bfa', '#fb923c', '#f87171'];
  return (
    <Card>
      <SectionHeader icon={Search} label="Search Reputation & Keyword Analysis" sub="What the internet associates with your name" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Keyword Association Map</p>
          {(sr.keyword_association_map ?? []).map(({ keyword_cluster, percentage, dominant_signal }, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: TEXT }}>{keyword_cluster}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: colors[i % colors.length] }}>{percentage}%</span>
              </div>
              <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${percentage}%`, background: colors[i % colors.length], borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>{dominant_signal}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: DIM, borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Identity Type</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: GOLD }}>{sr.identity_type}</div>
          </div>
          <Quote text={sr.identity_diagnosis} />
          <p style={{ fontSize: 12, color: TEXT, lineHeight: 1.65 }}>{sr.search_split_narrative}</p>
        </div>
      </div>

      <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Search Query Analysis</p>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 1.2fr', background: DIM, padding: '10px 16px', gap: 8 }}>
          {['Query', 'Dominant Signal', 'Results Type', 'Strategic Insight'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>
        {(sr.query_analysis ?? []).map((q, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 1.2fr', padding: '12px 16px', gap: 8, borderTop: `1px solid rgba(255,255,255,0.04)` }}>
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: GOLD }}>{q.query}</span>
            <span style={{ fontSize: 12, color: TEXT }}>{q.dominant_signal}</span>
            <span style={{ fontSize: 11, color: MUTED }}>{q.insight}</span>
            <span style={{ fontSize: 12, color: MUTED, fontStyle: 'italic' }}>{q.insight}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function S5_MediaFraming({ r }: { r: DiscoveryReport }) {
  const mf = r.media_framing;
  if (!mf) return (<>  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>Analysing… this section will appear shortly.</span>
    </div>
  </Card></>);
  
  const fColors = [GOLD, '#60a5fa', '#f87171', '#a78bfa', '#4ade80'];
  const frameEntries = [
    { k: 'expert_thought_leader', label: 'Expert / Thought Leader' },
    { k: 'business_operator',     label: 'Business Operator' },
    { k: 'family_figure',         label: 'Family / Legacy' },
    { k: 'personal_lifestyle',    label: 'Personal / Lifestyle' },
    { k: 'governance',            label: 'Governance / Board' },
  ] as const;

  return (
    <Card>
      <SectionHeader icon={FileText} label="Media Framing Analysis" sub="12-month lookback — how media defines this person" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>How Media Frames Them</p>
          {frameEntries.map(({ k, label }, i) => {
            const val = (mf.frame_distribution as Record<string, number>)[k] ?? 0;
            return <Bar key={k} label={label} value={val} color={fColors[i]} />;
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: DIM, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Primary Frame</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{mf.primary_frame}</div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Sector vs Non-Sector</p>
            <div style={{ display: 'flex', height: 30, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              <div style={{ flex: mf.sector_split.sector_context, background: `${GOLD}70`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{mf.sector_split.sector_context}%</span>
              </div>
              <div style={{ flex: mf.sector_split.non_sector_context, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: MUTED }}>{mf.sector_split.non_sector_context}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              <span style={{ fontSize: 10, color: MUTED }}>■ <span style={{ color: GOLD }}>Professional/Sector</span></span>
              <span style={{ fontSize: 10, color: MUTED }}>■ <span style={{ color: MUTED }}>Personal/Other</span></span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Media Language Signals</p>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: '#f87171', marginBottom: 5 }}>Currently Associated With</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(mf.media_language?.frequent_descriptors ?? []).map((d, i) => (
                  <span key={i} style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 11, color: '#f87171', fontStyle: 'italic' }}>"{d}"</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#4ade80', marginBottom: 5 }}>Should Be Associated With</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(mf.media_language?.rare_descriptors ?? []).map((d, i) => (
                  <span key={i} style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', fontSize: 11, color: '#4ade80' }}>{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: DIM, borderRadius: 10, padding: '16px' }}>
        <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>How Described in Domain Media</p>
        <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.7, marginBottom: 12 }}>{mf.how_described_in_domain_media}</p>
        <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.7 }}>{mf.framing_narrative}</p>
      </div>
      <InsightBox text={mf.strategic_framing_insight} />

      {mf.framing_narrative && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Framing Analysis</p>
          <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.7 }}>{mf.framing_narrative}</p>
        </div>
      )}
    </Card>
  );
}

function S6_SocialThoughtLeadership({ r }: { r: DiscoveryReport }) {
  const s = r.social_and_thought_leadership;
  if (!s) return (<>  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>Analysing… this section will appear shortly.</span>
    </div>
  </Card></>);
  
  const actColor = (a: string) => a === 'Active' ? '#4ade80' : a === 'Dormant' ? '#fb923c' : '#6b7280';

  const thoughtLeadershipItems = [
    { label: 'Conference Participation', items: s.conference_participation, icon: Users },
    { label: 'Speaking Engagements',     items: s.speaking_engagements,     icon: MessageSquare },
    { label: 'Op-eds / Articles',        items: s.op_eds,                   icon: FileText },
    { label: 'Speaking Engagements',     items: s.speaking_engagements,      icon: Radio },
    { label: 'Conference Participation', items: s.conference_participation,  icon: Radio },
    { label: 'Op-Eds & Articles',        items: s.op_eds,                    icon: Award },
  ] as const;

  return (
    <Card>
      <SectionHeader icon={Users} label="Social Media & Thought Leadership" sub="Digital voice, platform presence, original content" />

      <Quote text={s.overview_narrative} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 22 }}>
        <Badge text={`Visibility: ${s.visibility_tier}`} color={s.visibility_tier === 'High' ? '#4ade80' : s.visibility_tier.includes('Medium') ? GOLD : '#fb923c'} />
        <Badge text={`AI Discoverability: ${s.ai_discoverability}`} color='#818cf8' />
      </div>

      {/* Platform cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'LinkedIn', icon: '💼', data: s.linkedin },
          { label: 'Twitter / X', icon: '𝕏', data: s.twitter_x },
          { label: 'Wikipedia', icon: '📖', data: {
              followers: s.wikipedia.exists ? s.wikipedia.quality : 'Absent',
              activity: s.wikipedia.exists ? 'Exists' : 'Absent',
              positioning: s.wikipedia.quality,
              dormant: !s.wikipedia.exists,
            }
          },
        ].map(({ label, icon, data }) => (
          <div key={label} style={{ background: DIM, border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: actColor((data as Record<string,string>).activity ?? '') }}>
                {(data as Record<string,string>).activity}
              </span>
            </div>
            {(data as Record<string,string>).followers && (
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>
                Followers: <span style={{ color: TEXT }}>{(data as Record<string,string>).followers}</span>
              </div>
            )}
            {!!(data as Record<string,string>).positioning && (
              <div style={{ fontSize: 11, color: TEXT, lineHeight: 1.5 }}>
                {((data as Record<string,string>).positioning ?? '').slice(0, 120)}
              </div>
            )}
            {(data as unknown as { content_themes?: string[] }).content_themes?.length && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {((data as unknown as { content_themes: string[] }).content_themes ?? []).map((t: string, i: number) => (
                  <span key={i} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${GOLD}12`, color: GOLD }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Thought leadership grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {thoughtLeadershipItems.map(({ label, items, icon: Icon }) => (
          <div key={label} style={{ background: DIM, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Icon size={12} color={GOLD} />
              <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(items as string[]).map((item, i) => (
                <span key={i} style={{ fontSize: 12, color: TEXT }}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>AI Platform Discoverability</div>
        <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.65 }}>{s.ai_discoverability_narrative}</p>
      </div>
      <InsightBox icon={AlertTriangle} text={s.thought_leadership_gap} color='#fb923c' />
    </Card>
  );
}

function S7_PeerComparison({ r }: { r: DiscoveryReport }) {
  const pc = r.peer_comparison;
  if (!pc) return (<>  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>Analysing… this section will appear shortly.</span>
    </div>
  </Card></>);
  
  const visColor = (v: string) => v === 'High' ? '#4ade80' : v === 'Medium-High' ? GOLD : v === 'Medium' ? '#60a5fa' : '#fb923c';
  return (
    <Card>
      <SectionHeader icon={BarChart2} label="Competitive Intelligence & Peer Comparison" />
      <Quote text={pc.competitive_positioning_narrative} />
      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Peer Benchmarking</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 1fr 1fr 1.5fr', background: DIM, padding: '10px 16px', gap: 8 }}>
            {['Peer', 'Visibility', 'Primary Frame', 'Following', 'Gap Analysis'].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
            ))}
          </div>
          {(pc.peers ?? []).map((peer, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 1fr 1fr 1.5fr', padding: '14px 16px', gap: 8, borderTop: `1px solid rgba(255,255,255,0.04)`, alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{peer.name}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{peer.role}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: visColor(peer.visibility_level) }}>{peer.visibility_level}</span>
              <span style={{ fontSize: 12, color: TEXT }}>{peer.primary_frame}</span>
              <span style={{ fontSize: 12, color: TEXT }}>{peer.followers_approx}</span>
              <span style={{ fontSize: 12, color: TEXT }}>{peer.competitive_gap}</span>
            </div>
          ))}
        </div>
      </div>
      <InsightBox text={`Relative Visibility: ${pc.relative_visibility}`} />
    </Card>
  );
}

function S8_KeyQuestions({ r }: { r: DiscoveryReport }) {
  const kq = r.key_questions;
  if (!kq) return (<>  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>Analysing… this section will appear shortly.</span>
    </div>
  </Card></>);
  
  const questions = [
    { num: '01', q: 'Identity Architecture', a: kq.identity_architecture, icon: Target },
    { num: '02', q: 'Search Results Breakdown', a: kq.search_results_breakdown, icon: Search },
    { num: '03', q: 'Expert Cited vs Merely Mentioned', a: kq.expert_citation_vs_mention, icon: Award },
    { num: '04', q: 'Thought Leadership Presence', a: kq.thought_leadership_presence, icon: TrendingUp },
    { num: '05', q: 'Competitive Position', a: kq.competitive_position, icon: BarChart2 },
    { num: '06', q: 'Crisis / Negative Association', a: kq.crisis_association, icon: Shield },
    { num: '07', q: 'Global vs India Positioning', a: kq.global_positioning, icon: Globe },
  ] as const;
  return (
    <Card>
      <SectionHeader icon={Eye} label="Key Strategic Questions — Answered" sub="The 7 questions every SRE engagement must answer first" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
        {questions.map(({ num, q, a, icon: Icon }, i) => (
          <div key={num} style={{ display: 'grid', gridTemplateColumns: '48px 1fr 2fr', gap: 16, padding: '16px 20px', borderTop: i > 0 ? `1px solid rgba(255,255,255,0.05)` : 'none', alignItems: 'start' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: `${GOLD}30`, fontFamily: 'monospace' }}>{num}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
              <Icon size={13} color={GOLD} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{q}</span>
            </div>
            <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.65 }}>{a}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function S9_RiskMatrix({ r }: { r: DiscoveryReport }) {
  const ra = r.risk_assessment;
  if (!ra) return (<>  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: DIM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, opacity: 0.4 }} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>Analysing… this section will appear shortly.</span>
    </div>
  </Card></>);
  
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Card>
      <SectionHeader icon={AlertTriangle} label="Strategic Risk Layers Matrix" color='#fb923c' />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ padding: '8px 16px', background: DIM, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: MUTED }}>Overall: </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: severityColors(ra.overall_risk_level).text }}>{ra.overall_risk_level}</span>
        </div>
        <Badge text={ra.primary_risk_type} color='#fb923c' />
      </div>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 2fr auto', background: DIM, padding: '10px 16px', gap: 8 }}>
          {['Authority Layer', 'Observable Signal', 'Severity'].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
          ))}
        </div>
        {(ra.layers ?? []).map((layer, i) => {
          const sc = severityColors(layer.gap_severity);
          const isOpen = open === i;
          return (
            <div key={i}>
              <div onClick={() => setOpen(isOpen ? null : i)} style={{ display: 'grid', gridTemplateColumns: '1.8fr 2fr auto', padding: '13px 16px', gap: 8, borderTop: `1px solid rgba(255,255,255,0.04)`, cursor: 'pointer', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{layer.authority_layer}</span>
                <span style={{ fontSize: 12, color: TEXT }}>{layer.observable_signal.slice(0, 90)}{layer.observable_signal.length > 90 ? '…' : ''}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, whiteSpace: 'nowrap' }}>{layer.gap_severity}</span>
                  {isOpen ? <ChevronUp size={12} color={MUTED} /> : <ChevronDown size={12} color={MUTED} />}
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '0 16px 14px', background: `${sc.bg}` }}>
                  <p style={{ fontSize: 12, color: sc.text, margin: 0, lineHeight: 1.65, fontStyle: 'italic' }}>{layer.narrative}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>Click any row to expand the strategic narrative.</p>
    </Card>
  );
}

function S10_ReputationDiagnosis({ r }: { r: DiscoveryReport }) {
  const rd = r.reputation_diagnosis;
  if (!rd) return (<Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <span style={{ fontSize: 13, color: MUTED }}>Analysing… this section will appear shortly.</span>
    </div>
  </Card>);
  const rColor = rd.sre_opportunity_rating === 'Exceptional' ? '#4ade80' : rd.sre_opportunity_rating === 'High' ? GOLD : '#60a5fa';
  return (
    <Card>
      <SectionHeader icon={Activity} label="Reputation Diagnosis" sub="The complete strategic verdict" color='#818cf8' />
      <div style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(201,168,76,0.05))', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 14, padding: '22px 28px', marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Diagnosis</div>
        <p style={{ fontSize: 19, fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.4 }}>{rd.headline}</p>
        <div style={{ marginTop: 12 }}><Badge text={rd.primary_risk_type} color='#818cf8' /></div>
      </div>
      <div style={{ paddingLeft: 16, borderLeft: '3px solid #818cf8', marginBottom: 26 }}>
        <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.8, margin: 0 }}>{rd.narrative}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={12} color='#4ade80' /> Reputation Strengths
          </div>
          {(rd.strengths ?? []).map((s, i) => (
            <div key={i} style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8, padding: '11px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4ade80', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.55 }}>{s.description}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={12} color='#f87171' /> Reputation Vulnerabilities
          </div>
          {(rd.vulnerabilities ?? []).map((v, i) => (
            <div key={i} style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8, padding: '11px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 4 }}>{v.title}</div>
              <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.55 }}>{v.description}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: `${rColor}08`, border: `1px solid ${rColor}28`, borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: rColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>SRE Opportunity Signal</div>
          <p style={{ fontSize: 13, color: TEXT, margin: 0, lineHeight: 1.65 }}>{rd.opportunity_signal}</p>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: rColor }}>{rd.sre_opportunity_rating}</div>
          <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opportunity</div>
        </div>
      </div>
    </Card>
  );
}


// ── Download button component ────────────────────────────────────────────────
function DownloadReportButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = React.useState(false);
  async function download() {
    setLoading(true);
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, reportType: 'discovery' }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'SRE_Discovery_Report.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('PDF export failed. Try again.'); }
    finally { setLoading(false); }
  }
  return (
    <button onClick={download} disabled={loading} style={{
      padding: '10px 20px', background: 'transparent', color: GOLD,
      fontWeight: 600, fontSize: 13, borderRadius: 10, whiteSpace: 'nowrap',
      border: `1px solid rgba(201,168,76,0.4)`, cursor: loading ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 7,
    }}>
      {loading ? 'Generating PDF…' : '↓ Download SRE Report (PDF)'}
    </button>
  );
}
// ── Scanning UI ────────────────────────────────────────────────────────────
function ScanningView({ progress, stage }: { progress: number; stage: string }) {
  const stages = [
    { label: 'Search & AI Platforms',     range: [5, 20] as [number,number] },
    { label: 'News & Media',              range: [20, 35] as [number,number] },
    { label: 'Social Media',              range: [35, 50] as [number,number] },
    { label: 'Financial & Regulatory',    range: [50, 65] as [number,number] },
    { label: 'AI Sentiment & Framing',    range: [65, 85] as [number,number] },
    { label: 'Generating Narrative Report', range: [85, 95] as [number,number] },
    { label: 'Finalising',                range: [95, 100] as [number,number] },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 32 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid ${BORDER}`, borderTop: `3px solid ${GOLD}`, animation: 'spin 1.2s linear infinite' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>Building your reputation intelligence…</div>
        <div style={{ fontSize: 13, color: MUTED }}>{stage}</div>
        <div style={{ fontSize: 12, color: `${GOLD}90`, marginTop: 4 }}>{progress}% complete</div>
      </div>
      <div style={{ width: 440, maxWidth: '90vw' }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${GOLD}, #e8c97c)`, borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        {stages.map(({ label, range }) => {
          const done   = progress >= range[1];
          const active = progress >= range[0] && progress < range[1];
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, opacity: done || active ? 1 : 0.3 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${done ? '#4ade80' : active ? GOLD : BORDER}`, background: done ? 'rgba(74,222,128,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {done && <span style={{ fontSize: 10, color: '#4ade80' }}>✓</span>}
                {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, animation: 'pulse 1.5s ease-in-out infinite' }} />}
              </div>
              <span style={{ fontSize: 12, color: done ? '#4ade80' : active ? GOLD : MUTED }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const params   = useParams();
  const clientId = params.id as string;

  const [client,          setClient]          = useState<Record<string,unknown> | null>(null);
  const [scanRun,         setScanRun]         = useState<Record<string,unknown> | null>(null);
  const [discoveryReport, setDiscoveryReport] = useState<DiscoveryReport | null>(null);
  const [scanning,        setScanning]        = useState(false);
  const [progress,        setProgress]        = useState(0);
  const [stage,           setStage]           = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const generateReport = useCallback(async (cId: string) => {
    // report generation tracking
    setStage('Generating narrative intelligence report…');
    try {
      const res = await fetch('/api/discover/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: cId }),
        signal: AbortSignal.timeout(115_000),
      });
      if (res.ok) {
        const data = await res.json() as { report?: DiscoveryReport };
        if (data.report) setDiscoveryReport(data.report);
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        console.warn('[ReputeOS] Report generation failed:', err.error);
      }
    } catch (e) {
      console.warn('[ReputeOS] Report fetch error:', e instanceof Error ? e.message : e);
    } finally {
      setStage('');
    }
  }, []);

  const pollScanStatus = useCallback(async (runId: string) => {
    try {
      const res  = await fetch(`/api/discover/scan?runId=${runId}`);
      if (!res.ok) return;
      const data = await res.json() as Record<string,unknown>;
      setProgress(Number(data.progress) || 0);
      setStage(String(data.current_stage || ''));
      if (data.status === 'completed' || data.status === 'failed') {
        stopPolling();
        setScanning(false);
        setScanRun(data);
        if (data.discovery_report) {
          setDiscoveryReport(data.discovery_report as DiscoveryReport);
        } else if (data.status === 'completed' && data.id) {
          // Scan completed but no report yet — generate separately
          void fetchReport(String(data.id));
        }
      }
    } catch { /* silent */ }
  }, [stopPolling]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: c } = await supabase.from('clients').select('*').eq('id', clientId).eq('user_id', user.id).maybeSingle();
        setClient(c);
        const { data: run } = await supabase.from('discover_runs')
          .select('id,status,progress,current_stage,total_mentions,sentiment_summary,frame_distribution,top_keywords,analysis_summary,crisis_signals,lsi_preliminary,discovery_report,started_at,completed_at')
          .eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (run) {
          setScanRun(run);
          if (run.discovery_report) {
            setDiscoveryReport(run.discovery_report as DiscoveryReport);
          } else if (run.status === 'completed') {
            // Scan done but no report — auto-generate on page load
            setGeneratingReport(true);
            fetchReport(String(run.id)).finally(() => {});
          }
          if (run.status === 'in_progress') {
            setScanning(true);
            setProgress(Number(run.progress) || 0);
            setStage(String(run.current_stage || ''));
            pollRef.current = setInterval(() => pollScanStatus(String(run.id)), 3000);
          }
        }
      } finally { setLoading(false); }
    }
    load();
    return stopPolling;
  }, [clientId, pollScanStatus, stopPolling, generateReport]);

  async function fetchReport(runId: string) {
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/discover/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, clientId }),
        signal: AbortSignal.timeout(250_000),
      });
      const data = await res.json() as Record<string,unknown>;
      if (data.report) setDiscoveryReport(data.report as DiscoveryReport);
      else setError(String(data.error || 'Report generation failed'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Report generation failed');
    } finally {
      setGeneratingReport(false);
    }
  }

  async function startScan() {
    setError('');
    setScanning(true);
    setProgress(0);
    setStage('Initialising…');
    setDiscoveryReport(null);
    setScanRun(null);
    try {
      const res  = await fetch('/api/discover/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
        signal: AbortSignal.timeout(300_000),
      });
      const data = await res.json() as Record<string,unknown>;
      if (!res.ok) { setError(String(data.error || data.message || 'Scan failed')); setScanning(false); return; }
      if (data.runId) pollRef.current = setInterval(() => pollScanStatus(String(data.runId)), 3000);
      if (data.status === 'completed') {
        setScanning(false);
        setScanRun(data);
        if (data.discovery_report) {
          setDiscoveryReport(data.discovery_report as DiscoveryReport);
        } else {
          // Trigger report generation as a separate call
          void fetchReport(String(data.runId ?? data.id));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
      setScanning(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: GOLD, gap: 10 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
    </div>
  );

  const clientName    = String(client?.name ?? 'Client');
  const totalMentions = Number(scanRun?.total_mentions ?? 0);
  const lsi           = Number(scanRun?.lsi_preliminary ?? 0);
  const sentiment     = (scanRun?.sentiment_summary as Record<string,number>) ?? {};
  const crisisSignals = (scanRun?.crisis_signals as string[]) ?? [];
  const completedAt   = scanRun?.completed_at
    ? new Date(String(scanRun.completed_at)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  // ── Not started ──────────────────────────────────────────────────────────
  if (!scanRun && !scanning) return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${GOLD}12`, border: `2px solid ${GOLD}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <Search size={30} color={GOLD} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 14 }}>Reputation Intelligence Scan</h1>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, marginBottom: 10 }}>
          ReputeOS will audit <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{clientName}'s</strong> digital footprint across 62+ sources and produce a full 10-section SRE Discovery Report — the same depth as a premium PR agency engagement.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
          {['Profile & Career Analysis', 'Search Identity Map', 'Media Framing Report', 'Peer Comparison', 'Risk Assessment Matrix', 'Reputation Diagnosis'].map(f => (
            <span key={f} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, background: `${GOLD}10`, border: `1px solid ${GOLD}28`, color: GOLD }}>{f}</span>
          ))}
        </div>
        <button onClick={startScan} style={{ padding: '14px 40px', background: GOLD, color: '#080C14', fontWeight: 800, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', letterSpacing: '0.02em' }}>
          Run Discovery Scan →
        </button>
        {error && <p style={{ color: '#f87171', marginTop: 16, fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  );

  // ── Scanning ─────────────────────────────────────────────────────────────
  if (scanning) return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <ScanningView progress={progress} stage={stage} />
      {error && <p style={{ color: '#f87171', textAlign: 'center', marginTop: 12 }}>{error}</p>}
    </div>
  );

  // ── Report ────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 80 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Report header */}
      <div style={{ marginBottom: 28, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7 }}>SRE Discovery Report</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', margin: 0, marginBottom: 5 }}>{clientName}</h1>
            {completedAt && <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>Scanned {completedAt} · {totalMentions} mentions · 62+ sources</p>}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {lsi > 0 && (
              <div style={{ textAlign: 'center', padding: '12px 20px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: lsi >= 70 ? '#4ade80' : lsi >= 50 ? GOLD : '#fb923c' }}>{lsi}</div>
                <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preliminary LSI</div>
              </div>
            )}
            <button onClick={startScan} style={{ padding: '10px 16px', background: 'transparent', color: GOLD, border: `1px solid ${GOLD}45`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
              <RefreshCw size={13} /> Rescan
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total Mentions',  value: totalMentions.toString(),                     color: 'white' },
          { label: 'Positive Tone',   value: `${sentiment.positive ?? 0}%`,                color: '#4ade80' },
          { label: 'Negative Signals', value: `${sentiment.negative ?? 0}%`,               color: sentiment.negative > 15 ? '#f87171' : '#4ade80' },
          { label: 'Crisis Signals',  value: crisisSignals.length > 0 ? 'Detected' : 'None', color: crisisSignals.length > 0 ? '#f87171' : '#4ade80' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Full narrative report */}
      {discoveryReport ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <S1_ProfileOverview      r={discoveryReport} />
          <S2_ProfessionalBackground r={discoveryReport} />
          <S3_RecentDevelopments   r={discoveryReport} />
          <S4_SearchReputation     r={discoveryReport} />
          <S5_MediaFraming         r={discoveryReport} />
          <S6_SocialThoughtLeadership r={discoveryReport} />
          <S7_PeerComparison       r={discoveryReport} />
          <S8_KeyQuestions         r={discoveryReport} />
          <S9_RiskMatrix           r={discoveryReport} />
          <S10_ReputationDiagnosis r={discoveryReport} />
        </div>
      ) : generatingReport ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
          <div style={{ width: 60, height: 60, borderRadius: '50%', border: `3px solid ${BORDER}`, borderTop: `3px solid ${GOLD}`, animation: 'spin 1.2s linear infinite', margin: '0 auto 24px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 10 }}>Generating Intelligence Report…</h3>
          <p style={{ fontSize: 13, color: MUTED, maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.7 }}>
            Claude is analysing {clientName}'s digital footprint, career history, industry context, and competitive landscape to produce your 10-section SRE Discovery Report. This takes 45–90 seconds.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {['Profile & Background', 'Search Identity', 'Media Framing', 'Peer Analysis', 'Risk Assessment'].map((s, i) => (
              <span key={i} style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, background: `${GOLD}10`, border: `1px solid ${GOLD}25`, color: `${GOLD}80`, animation: `pulse ${1.2 + i * 0.2}s ease-in-out infinite` }}>{s}</span>
            ))}
          </div>
          {error && <p style={{ color: '#f87171', marginTop: 20, fontSize: 13 }}>{error}</p>}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Activity size={40} color={MUTED} style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Report generation failed</h3>
          <p style={{ fontSize: 13, color: MUTED, maxWidth: 400, margin: '0 auto 24px' }}>
            The scan data was collected but the AI narrative report could not be generated. This is usually a temporary AI service issue.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scanRun?.id && fetchReport(String(scanRun.id))} style={{ padding: '12px 24px', background: GOLD, color: '#080C14', fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
              Generate Report (Scan data ready) →
            </button>
            <button onClick={startScan} style={{ padding: '12px 24px', background: 'transparent', color: GOLD, border: `1px solid ${GOLD}45`, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
              Full Rescan
            </button>
          </div>
          {error && <p style={{ color: '#f87171', marginTop: 12, fontSize: 13 }}>{error}</p>}
        </div>
      )}

      {/* ── Flow Progression CTA ──────────────────────────────────────── */}
      {discoveryReport && (
        <div style={{
          marginTop: 40, padding: '32px 36px',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(8,12,20,0) 100%)',
          border: `1px solid ${GOLD}30`, borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Discovery Complete — What's Next?</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: 0, marginBottom: 6 }}>Diagnose Your Reputation Score</h3>
            <p style={{ fontSize: 13, color: MUTED, margin: 0, maxWidth: 480 }}>
              Your digital footprint is mapped across 62 sources. Now calculate your LSI score — a precise measure of your reputation strength across 6 dimensions.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
            <a href={`/dashboard/clients/${clientId}/diagnose`} style={{
              padding: '14px 28px', background: GOLD, color: '#080C14',
              fontWeight: 800, fontSize: 14, borderRadius: 10, border: 'none',
              cursor: 'pointer', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            }}>
              Calculate My LSI Score →
            </a>
            <DownloadReportButton clientId={clientId} />
          </div>
        </div>
      )}
    </div>
  );
}
