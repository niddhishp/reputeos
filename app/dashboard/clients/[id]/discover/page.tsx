'use client';
/**
 * DISCOVER PAGE — SRE-Grade Reputation Intelligence Report
 * =========================================================
 * Transforms raw scan data into a professional advisory document.
 * Every number is accompanied by narrative. Every metric has meaning.
 * Mirrors the quality of Adfactors/Edelman SRE discovery decks.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  Search, RefreshCw, AlertTriangle, CheckCircle, Eye,
  TrendingUp, Shield, Users, Globe, FileText, Zap,
  ChevronDown, ChevronUp, ExternalLink, Info, Award,
  Radio, Target, BarChart2, Activity,
} from 'lucide-react';
import type { DiscoveryReport } from '@/app/api/discover/sources/discovery-report-prompt';

// ── Design tokens ──────────────────────────────────────────────────────────
const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BG     = '#080C14';
const BORDER = 'rgba(201,168,76,0.15)';
const MUTED  = 'rgba(255,255,255,0.35)';
const DIM    = 'rgba(255,255,255,0.12)';

// ── Helpers ────────────────────────────────────────────────────────────────
function severityColor(sev: string) {
  if (sev === 'High')          return { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)', text: '#f87171' };
  if (sev === 'Moderate-High') return { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.4)',  text: '#fb923c' };
  if (sev === 'Moderate')      return { bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.35)', text: '#fbbf24' };
  return                              { bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.3)',  text: '#4ade80' };
}
function tierColor(tier: string) {
  if (tier === 'High')         return '#4ade80';
  if (tier === 'Medium-High')  return GOLD;
  if (tier === 'Medium')       return '#60a5fa';
  if (tier === 'Low')          return '#fb923c';
  return '#f87171';
}
function sectionCard(children: React.ReactNode, extraStyle?: React.CSSProperties) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px 32px', ...extraStyle }}>
      {children}
    </div>
  );
}
function SectionTitle({ icon: Icon, label, color = GOLD }: { icon: React.ElementType; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</h3>
    </div>
  );
}
function Pill({ text, color = GOLD }: { text: string; color?: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${color}18`, border: `1px solid ${color}40`, color }}>
      {text}
    </span>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProfileSnapshot({ report, client }: { report: DiscoveryReport; client: Record<string,unknown> }) {
  const snap = report.profile_snapshot;
  const score = snap.digital_presence_score;
  const scoreColor = score >= 70 ? '#4ade80' : score >= 50 ? GOLD : score >= 30 ? '#fb923c' : '#f87171';

  return sectionCard(
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Identity Headline</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1.3, margin: 0, maxWidth: 560 }}>{snap.identity_headline}</h2>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Digital Presence</div>
          <div style={{ fontSize: 11, color: scoreColor, marginTop: 2, fontWeight: 600 }}>/ 100</div>
        </div>
      </div>

      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 20, borderLeft: `3px solid ${GOLD}`, paddingLeft: 16 }}>
        {snap.summary}
      </p>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Career Highlights</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {snap.career_highlights.map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${GOLD}20`, border: `1px solid ${GOLD}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: GOLD }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{h}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(201,168,76,0.04)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 16px' }}>
        <span style={{ fontSize: 12, color: MUTED }}>Digital Presence Assessment: </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{snap.digital_presence_narrative}</span>
      </div>
    </>
  );
}

function SocialStanding({ report }: { report: DiscoveryReport }) {
  const s = report.social_standing;
  const platforms = [
    { key: 'linkedin', label: 'LinkedIn', icon: '💼', data: s.platform_breakdown.linkedin },
    { key: 'twitter',  label: 'Twitter / X', icon: '𝕏', data: s.platform_breakdown.twitter },
    { key: 'wikipedia', label: 'Wikipedia', icon: '📖',
      data: { followers: s.platform_breakdown.wikipedia.exists ? s.platform_breakdown.wikipedia.quality : 'Absent',
              activity: s.platform_breakdown.wikipedia.exists ? 'Exists' : 'Absent',
              positioning: s.platform_breakdown.wikipedia.narrative, dormant: !s.platform_breakdown.wikipedia.exists } },
    { key: 'instagram', label: 'Instagram', icon: '📷', data: { ...s.platform_breakdown.instagram, positioning: '', dormant: s.platform_breakdown.instagram.activity === 'Absent' } },
  ];

  const actColor = (a: string) => a === 'Active' ? '#4ade80' : a === 'Dormant' ? '#fb923c' : '#6b7280';

  return sectionCard(
    <>
      <SectionTitle icon={Users} label="Social Standing & Digital Visibility" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{s.overview_narrative}</p>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: tierColor(s.visibility_tier) }}>{s.visibility_tier}</div>
          <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visibility Tier</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        {platforms.map(({ label, icon, data }) => (
          <div key={label} style={{ background: DIM, border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: actColor(data.activity) }}>{data.activity}</span>
            </div>
            {data.followers && <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Followers: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{data.followers}</span></div>}
            {data.positioning && <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{data.positioning.slice(0, 100)}</div>}
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Globe size={13} color='#818cf8' />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8' }}>AI Platform Discoverability — {s.ai_discoverability}</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>{s.ai_discoverability_narrative}</p>
      </div>
    </>
  );
}

function SearchIdentityAnalysis({ report }: { report: DiscoveryReport }) {
  const si = report.search_identity;
  const splitEntries = [
    { label: 'Business Leadership', value: si.identity_split.business_leadership, color: GOLD },
    { label: 'Family / Lineage',    value: si.identity_split.family_context, color: '#f87171' },
    { label: 'Personal / Lifestyle', value: si.identity_split.personal_lifestyle, color: '#60a5fa' },
    { label: 'Governance / Institutional', value: si.identity_split.governance_institutional, color: '#4ade80' },
    { label: 'Other',               value: si.identity_split.other, color: '#6b7280' },
  ].filter(e => e.value > 0);

  return sectionCard(
    <>
      <SectionTitle icon={Search} label="Search Identity Analysis" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Identity split bar */}
        <div>
          <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Search Identity Split</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {splitEntries.map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '8px 12px', background: DIM, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dominant Signal</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{si.dominant_signal}</div>
          </div>
        </div>

        {/* Identity type + diagnosis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '14px 16px', background: 'rgba(201,168,76,0.06)', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
            <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Identity Type</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: GOLD }}>{si.identity_type}</div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{si.identity_diagnosis}</p>
        </div>
      </div>

      {/* Query analysis table */}
      <div>
        <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Search Query Analysis</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', background: DIM, padding: '10px 16px', borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dominant Signal</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategic Implication</span>
          </div>
          {si.query_analysis.map((q, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', padding: '12px 16px', borderBottom: i < si.query_analysis.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none', gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: GOLD }}>{q.query}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{q.dominant_signal}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{q.insight}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MediaFramingReport({ report }: { report: DiscoveryReport }) {
  const mf = report.media_framing;
  const frameEntries = [
    { label: 'Expert / Thought Leader', value: mf.frame_distribution.expert_leader,    color: GOLD },
    { label: 'Business Operator',       value: mf.frame_distribution.business_operator, color: '#60a5fa' },
    { label: 'Family Figure / Legacy',  value: mf.frame_distribution.family_figure,    color: '#f87171' },
    { label: 'Governance / Board',      value: mf.frame_distribution.governance,        color: '#4ade80' },
    { label: 'Personal / Lifestyle',    value: mf.frame_distribution.personal_lifestyle, color: '#a78bfa' },
  ].filter(e => e.value > 0);

  return sectionCard(
    <>
      <SectionTitle icon={FileText} label="Media Framing Report — 12-Month Analysis" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Frame distribution */}
        <div>
          <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>How Media Frames This Person</p>
          {frameEntries.map(({ label, value, color }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Sector split + media language */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Sector vs. Non-Sector Coverage</p>
            <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              <div style={{ flex: mf.sector_split.sector_context, background: `${GOLD}80`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{mf.sector_split.sector_context}%</span>
              </div>
              <div style={{ flex: mf.sector_split.non_sector_context, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: MUTED }}>{mf.sector_split.non_sector_context}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              <span style={{ fontSize: 11, color: MUTED }}>■ <span style={{ color: GOLD }}>Sector/Business</span></span>
              <span style={{ fontSize: 11, color: MUTED }}>■ <span style={{ color: MUTED }}>Personal/Family</span></span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Media Language Signals</p>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#f87171', marginBottom: 4 }}>Frequently Used</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {mf.media_language.frequent_descriptors.map((d, i) => (
                  <span key={i} style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 11, color: '#f87171', fontStyle: 'italic' }}>"{d}"</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#4ade80', marginBottom: 4 }}>Rarely Seen (should be)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {mf.media_language.rare_descriptors.map((d, i) => (
                  <span key={i} style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', fontSize: 11, color: '#4ade80' }}>{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 10 }}>{mf.framing_narrative}</p>
        <div style={{ padding: '12px 16px', background: 'rgba(201,168,76,0.06)', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Zap size={14} color={GOLD} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, fontWeight: 500, color: GOLD, margin: 0, lineHeight: 1.6 }}>{mf.strategic_framing_insight}</p>
        </div>
      </div>
    </>
  );
}

function RiskAssessmentMatrix({ report }: { report: DiscoveryReport }) {
  const ra = report.risk_assessment;
  const [expanded, setExpanded] = useState<number | null>(null);

  return sectionCard(
    <>
      <SectionTitle icon={AlertTriangle} label="Strategic Risk Layers Matrix" color='#fb923c' />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 11, color: MUTED }}>Overall Risk Level: </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: severityColor(ra.overall_risk_level).text }}>{ra.overall_risk_level}</span>
        </div>
        <div style={{ width: 1, height: 16, background: BORDER }} />
        <Pill text={ra.primary_risk_type} color='#fb923c' />
      </div>

      {/* Risk table */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 2fr auto', background: DIM, padding: '10px 16px', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authority Layer</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observable Signal</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Severity</span>
        </div>
        {ra.layers.map((layer, i) => {
          const sc = severityColor(layer.gap_severity);
          const isOpen = expanded === i;
          return (
            <div key={i}>
              <div
                onClick={() => setExpanded(isOpen ? null : i)}
                style={{ display: 'grid', gridTemplateColumns: '1.8fr 2fr auto', padding: '12px 16px', gap: 8, borderTop: `1px solid rgba(255,255,255,0.04)`, cursor: 'pointer', alignItems: 'center' }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{layer.authority_layer}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{layer.observable_signal.slice(0, 80)}{layer.observable_signal.length > 80 ? '…' : ''}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, whiteSpace: 'nowrap' }}>
                    {layer.gap_severity}
                  </span>
                  {isOpen ? <ChevronUp size={13} color={MUTED} /> : <ChevronDown size={13} color={MUTED} />}
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '0 16px 14px 16px', background: `${sc.bg}` }}>
                  <p style={{ fontSize: 12, color: sc.text, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>{layer.narrative}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>Click any row to expand the strategic narrative behind each risk signal.</p>
    </>
  );
}

function StrategicQuestions({ report }: { report: DiscoveryReport }) {
  const sq = report.strategic_questions;
  const questions = [
    { q: 'Identity Architecture', a: sq.identity_architecture, icon: Target },
    { q: 'Visibility vs. Peers', a: sq.visibility_level, icon: Eye },
    { q: 'Thought Leadership Gap', a: sq.thought_leadership_gap, icon: TrendingUp },
    { q: 'Crisis Proximity', a: sq.crisis_proximity, icon: Shield },
    { q: 'Competitive Positioning', a: sq.competitive_positioning, icon: BarChart2 },
    { q: 'Global vs. India', a: sq.global_vs_india_positioning, icon: Globe },
  ];

  return sectionCard(
    <>
      <SectionTitle icon={Info} label="Key Strategic Questions — Answered" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {questions.map(({ q, a, icon: Icon }) => (
          <div key={q} style={{ background: DIM, border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon size={12} color={GOLD} />
              <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{q}</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{a}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function ReputationDiagnosis({ report }: { report: DiscoveryReport }) {
  const rd = report.reputation_diagnosis;
  const ratingColor = rd.sre_opportunity_rating === 'Exceptional' ? '#4ade80' : rd.sre_opportunity_rating === 'High' ? GOLD : '#60a5fa';

  return sectionCard(
    <>
      <SectionTitle icon={Activity} label="Reputation Diagnosis" color='#818cf8' />

      {/* Headline */}
      <div style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(201,168,76,0.06))', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Diagnosis</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0, lineHeight: 1.4 }}>{rd.headline}</p>
        <div style={{ marginTop: 12 }}>
          <Pill text={rd.primary_risk_type} color='#818cf8' />
        </div>
      </div>

      {/* Narrative */}
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 24, paddingLeft: 16, borderLeft: `3px solid #818cf8` }}>
        {rd.narrative}
      </p>

      {/* Strengths + Vulnerabilities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={12} color='#4ade80' /> Reputation Strengths
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rd.strengths.map((s, i) => (
              <div key={i} style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#4ade80', marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{s.description}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={12} color='#f87171' /> Reputation Vulnerabilities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rd.vulnerabilities.map((v, i) => (
              <div key={i} style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f87171', marginBottom: 3 }}>{v.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{v.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Opportunity */}
      <div style={{ background: `${ratingColor}08`, border: `1px solid ${ratingColor}30`, borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: ratingColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>SRE Opportunity Signal</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.6 }}>{rd.opportunity_signal}</p>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: ratingColor }}>{rd.sre_opportunity_rating}</div>
          <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opportunity</div>
        </div>
      </div>
    </>
  );
}



// ── Scanning state ─────────────────────────────────────────────────────────
function ScanningView({ progress, stage }: { progress: number; stage: string }) {
  const stages = [
    { label: 'Search & AI Platforms', range: [5, 20] },
    { label: 'News & Media', range: [20, 35] },
    { label: 'Social Media', range: [35, 50] },
    { label: 'Financial & Regulatory', range: [50, 65] },
    { label: 'AI Sentiment Analysis', range: [65, 85] },
    { label: 'Building Narrative Report', range: [85, 95] },
    { label: 'Saving Results', range: [95, 100] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 32 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ width: 80, height: 80, borderRadius: '50%', border: `3px solid ${BORDER}`, borderTop: `3px solid ${GOLD}`, animation: 'spin 1.2s linear infinite' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>Scanning your digital footprint…</div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 4 }}>{stage}</div>
        <div style={{ fontSize: 11, color: `${GOLD}90` }}>{progress}% complete</div>
      </div>
      <div style={{ width: 400, maxWidth: '90vw' }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${GOLD}, #e8c97c)`, borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {stages.map(({ label, range }) => {
            const done   = progress >= range[1];
            const active = progress >= range[0] && progress < range[1];
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: done || active ? 1 : 0.35 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${done ? '#4ade80' : active ? GOLD : BORDER}`, background: done ? 'rgba(74,222,128,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {done && <span style={{ fontSize: 10, color: '#4ade80' }}>✓</span>}
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, animation: 'pulse 1.5s ease-in-out infinite' }} />}
                </div>
                <span style={{ fontSize: 12, color: done ? '#4ade80' : active ? GOLD : MUTED }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const params   = useParams();
  const clientId = params.id as string;

  const [client,        setClient]        = useState<Record<string,unknown> | null>(null);
  const [scanRun,       setScanRun]       = useState<Record<string,unknown> | null>(null);
  const [discoveryReport, setDiscoveryReport] = useState<DiscoveryReport | null>(null);
  const [scanning,      setScanning]      = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [stage,         setStage]         = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(true);
  const pollRef         = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const pollScanStatus = useCallback(async (runId: string) => {
    try {
      const res = await fetch(`/api/discover/scan?runId=${runId}`);
      if (!res.ok) return;
      const data = await res.json() as Record<string,unknown>;
      setProgress(Number(data.progress) || 0);
      setStage(String(data.current_stage || ''));
      if (data.status === 'completed' || data.status === 'failed') {
        stopPolling();
        setScanning(false);
        setScanRun(data);
        if (data.discovery_report) setDiscoveryReport(data.discovery_report as DiscoveryReport);
      }
    } catch { /* poll errors are silent */ }
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
          .select('id, status, progress, current_stage, total_mentions, sentiment_summary, frame_distribution, top_keywords, analysis_summary, archetype_hints, crisis_signals, lsi_preliminary, discovery_report, started_at, completed_at')
          .eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (run) {
          setScanRun(run);
          if (run.discovery_report) setDiscoveryReport(run.discovery_report as DiscoveryReport);
          if (run.status === 'in_progress') {
            setScanning(true);
            setProgress(Number(run.progress) || 0);
            setStage(String(run.current_stage || ''));
            pollRef.current = setInterval(() => pollScanStatus(String(run.id)), 3000);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return stopPolling;
  }, [clientId, pollScanStatus, stopPolling]);

  async function startScan() {
    setError('');
    setScanning(true);
    setProgress(0);
    setStage('Initialising scan...');
    setDiscoveryReport(null);
    setScanRun(null);
    try {
      const res = await fetch('/api/discover/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
        signal: AbortSignal.timeout(280_000),
      });
      const data = await res.json() as Record<string,unknown>;
      if (!res.ok) { setError(String(data.error || data.message || 'Scan failed')); setScanning(false); return; }
      if (data.runId) pollRef.current = setInterval(() => pollScanStatus(String(data.runId)), 3000);
      if (data.status === 'completed') {
        setScanning(false);
        setScanRun(data);
        if (data.discovery_report) setDiscoveryReport(data.discovery_report as DiscoveryReport);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan request failed');
      setScanning(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: GOLD }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} /> Loading…
    </div>
  );

  const clientName = String(client?.name ?? 'Client');
  const sentiment  = (scanRun?.sentiment_summary as Record<string,number>) ?? {};
  const frames     = (scanRun?.frame_distribution as Record<string,number>) ?? {};
  const keywords   = (scanRun?.top_keywords as string[]) ?? [];
  const totalMentions = Number(scanRun?.total_mentions ?? 0);
  const lsi        = Number(scanRun?.lsi_preliminary ?? 0);

  // ── Not started ────────────────────────────────────────────────────────────
  if (!scanRun && !scanning) {
    return (
      <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${GOLD}15`, border: `2px solid ${GOLD}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Search size={28} color={GOLD} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 12 }}>Reputation Intelligence Scan</h1>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 8 }}>
            ReputeOS will audit <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{clientName}'s</strong> digital footprint across 62+ sources — search engines, news archives, social platforms, AI platforms, financial databases, regulatory filings, and academic repositories.
          </p>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, marginBottom: 32 }}>
            You'll receive a full SRE Discovery Report: search identity analysis, media framing breakdown, risk assessment matrix, and reputation diagnosis — the same depth as a premium PR agency engagement.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            {['62+ Sources', 'AI Narrative Analysis', 'Risk Matrix', 'Reputation Diagnosis'].map(f => (
              <span key={f} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: GOLD }}>{f}</span>
            ))}
          </div>
          <button onClick={startScan} style={{ padding: '14px 36px', background: GOLD, color: '#080C14', fontWeight: 800, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', letterSpacing: '0.02em' }}>
            Run Discovery Scan →
          </button>
          {error && <p style={{ color: '#f87171', marginTop: 16, fontSize: 13 }}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── Scanning ────────────────────────────────────────────────────────────────
  if (scanning) {
    return (
      <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <ScanningView progress={progress} stage={stage} />
        {error && <p style={{ color: '#f87171', textAlign: 'center', marginTop: 16 }}>{error}</p>}
      </div>
    );
  }

  // ── Complete: Show full report ───────────────────────────────────────────
  const completedAt = scanRun?.completed_at ? new Date(String(scanRun.completed_at)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';

  return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 80 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Report header */}
      <div style={{ marginBottom: 32, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>SRE Discovery Report</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: 0, marginBottom: 4 }}>{clientName}</h1>
            <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>Scanned {completedAt} · {totalMentions} mentions across 62+ sources</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {lsi > 0 && (
              <div style={{ textAlign: 'center', padding: '10px 18px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: lsi >= 70 ? '#4ade80' : lsi >= 50 ? GOLD : '#fb923c' }}>{lsi}</div>
                <div style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preliminary LSI</div>
              </div>
            )}
            <button onClick={startScan} style={{ padding: '10px 18px', background: 'transparent', color: GOLD, border: `1px solid ${GOLD}50`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit' }}>
              <RefreshCw size={13} /> Rescan
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total Mentions',  value: totalMentions.toString(), color: 'white' },
          { label: 'Positive Tone',   value: `${sentiment.positive ?? 0}%`, color: '#4ade80' },
          { label: 'Dominant Frame',  value: Object.entries(frames).sort(([,a],[,b]) => b-a)[0]?.[0] ?? 'N/A', color: GOLD },
          { label: 'Crisis Signals',  value: (scanRun?.crisis_signals as string[])?.length > 0 ? 'Detected' : 'None', color: (scanRun?.crisis_signals as string[])?.length > 0 ? '#f87171' : '#4ade80' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Narrative report sections */}
      {discoveryReport ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ProfileSnapshot report={discoveryReport} client={client ?? {}} />
          <SocialStanding report={discoveryReport} />
          <SearchIdentityAnalysis report={discoveryReport} />
          <MediaFramingReport report={discoveryReport} />
          <RiskAssessmentMatrix report={discoveryReport} />
          <StrategicQuestions report={discoveryReport} />
          <ReputationDiagnosis report={discoveryReport} />
        </div>
      ) : (
        // Fallback: raw data when no narrative report yet
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary */}
          {!!scanRun?.analysis_summary && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
              <SectionTitle icon={FileText} label="Discovery Summary" />
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, margin: 0 }}>{String(scanRun.analysis_summary ?? "")}</p>
            </div>
          )}

          {/* Sentiment */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
            <SectionTitle icon={Activity} label="Sentiment Distribution" />
            {[
              { label: 'Positive', value: sentiment.positive ?? 0, color: '#4ade80' },
              { label: 'Neutral',  value: sentiment.neutral  ?? 0, color: '#60a5fa' },
              { label: 'Negative', value: sentiment.negative ?? 0, color: '#f87171' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
            <p style={{ fontSize: 12, color: MUTED, marginTop: 12, marginBottom: 0 }}>Full narrative analysis will be available when report generation completes.</p>
          </div>

          {/* Frame distribution */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
            <SectionTitle icon={BarChart2} label="Frame Distribution" />
            {Object.entries(frames).sort(([,a],[,b]) => b - a).map(([frame, pct]) => (
              <div key={frame} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{frame}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: GOLD, borderRadius: 3, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Keywords */}
          {keywords.length > 0 && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
              <SectionTitle icon={Radio} label="Top Keywords" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {keywords.map((kw, i) => (
                  <span key={i} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: GOLD }}>{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keywords footer (always show if report is present) */}
      {discoveryReport && keywords.length > 0 && (
        <div style={{ marginTop: 20, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
          <SectionTitle icon={Radio} label="Top Keywords from Digital Footprint" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {keywords.map((kw, i) => (
              <span key={i} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: GOLD }}>{kw}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
