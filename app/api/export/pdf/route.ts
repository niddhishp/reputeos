/**
 * PDF Export — SRE Discovery Reputation Report
 * POST /api/export/pdf
 *
 * Generates a professional SRE-grade report matching the Adfactors PR template structure.
 * 7 sections: Profile | Social | Mentions | Search | Risk Heatmap | LSI | Strategy
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, verifyClientOwnership } from '@/lib/supabase/server';

const Schema = z.object({
  clientId:   z.string().uuid(),
  reportType: z.enum(['discovery', 'board', 'investor', 'case_study']).default('discovery'),
});

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { clientId } = parsed.data;
  const isOwner = await verifyClientOwnership(clientId);
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const [
    { data: client },
    { data: lsiRun },
    { data: discoverRun },
    { data: positioning },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
    supabase.from('lsi_runs').select('*').eq('client_id', clientId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('discover_runs').select('*').eq('client_id', clientId)
      .eq('status', 'completed').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('positioning').select('*').eq('client_id', clientId).maybeSingle(),
  ]);

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  // ── Type helpers ────────────────────────────────────────────────────────────
  type JV = Record<string, unknown>;

  const cl  = client  as JV;
  const lr  = (lsiRun   ?? {}) as JV;
  const dr  = (discoverRun ?? {}) as JV;
  const pos = (positioning ?? {}) as JV;

  const lsiScore       = Math.round((lr.total_score  as number) ?? 0);
  const components     = (lr.components      as JV)  ?? {};
  const riskHeatmap    = (lr.risk_heatmap    as JV[]) ?? [];
  const strengths      = (lr.identified_strengths as JV[]) ?? [];
  const riskFactors    = (lr.risk_factors    as JV[]) ?? [];
  const interventionPlan = (lr.intervention_plan as JV) ?? {};
  const gaps           = (lr.gaps            as JV[]) ?? [];

  const frameDist      = (dr.frame_distribution as JV) ?? (dr.frame_dist as JV) ?? {};
  const totalMentions  = (dr.total_mentions  as number) ?? 0;
  const platformAssess = (dr.platform_assessment as JV) ?? {};
  const searchQA       = (dr.search_query_analysis as JV[]) ?? [];
  const discReport     = (dr.discovery_report as JV) ?? {};
  const riskAssessment = (discReport.risk_assessment as JV) ?? {};
  const repDiagnosis   = (discReport.reputation_diagnosis as JV) ?? {};
  const searchRep      = (discReport.search_reputation as JV) ?? {};

  const archReveal     = (pos.archetype_reveal as JV) ?? {};
  const contentPillars = (pos.content_pillars as JV[]) ?? [];
  const archetype      = (pos.personal_archetype as string) ?? '—';
  const bizArchetype   = (pos.business_archetype as string) ?? '';
  const followability  = Math.round((pos.followability_score as number) ?? 0);
  const posStatement   = (pos.positioning_statement as string) ?? '';

  // LSI classification
  function lsiClass(s: number) {
    if (s >= 86) return 'Elite Authority';
    if (s >= 71) return 'Strong Authority';
    if (s >= 56) return 'Functional Legitimacy';
    if (s >= 36) return 'Reputation Vulnerability';
    return 'Severe Impairment';
  }

  // Listening period
  const now = new Date();
  const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);
  const listeningPeriod = `${sixMonthsAgo.toLocaleDateString('en-US',{month:'short',year:'2-digit'})} – ${now.toLocaleDateString('en-US',{month:'short',year:'2-digit'})}`;

  // ── jsPDF setup ─────────────────────────────────────────────────────────────
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, H = 297, M = 18;
  const CW = W - 2 * M; // content width = 174

  // Colour palette (print-safe)
  const NAVY   = [10,  22,  40]  as [number,number,number];
  const GOLD_C = [180, 140, 50]  as [number,number,number];
  const GRAY   = [100, 108, 120] as [number,number,number];
  const LGRAY  = [240, 241, 243] as [number,number,number];
  const WHITE  = [255, 255, 255] as [number,number,number];
  const GREEN  = [22,  160, 100] as [number,number,number];
  const AMBER  = [210, 130, 20]  as [number,number,number];
  const RED_C  = [200, 60,  60]  as [number,number,number];
  const NAVY2  = [18,  40,  80]  as [number,number,number];

  // Helpers
  const col = (c:[number,number,number]) => doc.setTextColor(c[0],c[1],c[2]);
  const fill = (c:[number,number,number]) => doc.setFillColor(c[0],c[1],c[2]);
  const stroke = (c:[number,number,number]) => doc.setDrawColor(c[0],c[1],c[2]);

  function addPage() {
    doc.addPage();
    // White bg
    fill(WHITE); doc.rect(0, 0, W, H, 'F');
    // Left gold bar
    fill(GOLD_C); doc.rect(0, 0, 2.5, H, 'F');
    // Confidential footer
    col(GRAY); doc.setFontSize(7); doc.setFont('helvetica','normal');
    doc.text('CONFIDENTIAL — SRE Discovery Scan — Generated by ReputeOS', M, H - 8);
    doc.text(new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), W - M, H - 8, { align:'right' });
  }

  function sectionHeader(label: string, title: string, y: number) {
    fill(NAVY2); doc.rect(M, y, CW, 9, 'F');
    col(GOLD_C); doc.setFontSize(7.5); doc.setFont('helvetica','bold');
    doc.text(label, M + 4, y + 6);
    col(WHITE); doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text(title, M + 40, y + 6);
    return y + 14;
  }

  function fieldRow(label: string, value: string, y: number, labelW = 50) {
    col(GRAY); doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text(label, M, y);
    col(NAVY); doc.setFontSize(9); doc.setFont('helvetica','normal');
    const lines = doc.splitTextToSize(value, CW - labelW) as string[];
    doc.text(lines, M + labelW, y);
    return y + lines.length * 5 + 2;
  }

  function tableRow(cells: string[], colWidths: number[], y: number, isHeader = false, altBg = false) {
    if (altBg && !isHeader) { fill(LGRAY); doc.rect(M, y - 4, CW, 7.5, 'F'); }
    if (isHeader) { fill(NAVY2); doc.rect(M, y - 4, CW, 7.5, 'F'); }
    let x = M;
    cells.forEach((cell, i) => {
      const cw = colWidths[i];
      if (isHeader) { col(WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8); }
      else          { col(NAVY);  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); }
      const lines = doc.splitTextToSize(cell, cw - 3) as string[];
      doc.text(lines, x + 2, y);
      x += cw;
    });
    return y + 7.5;
  }

  function riskBadge(risk: string, x: number, y: number) {
    const r = risk?.toUpperCase() ?? '';
    const bg: [number,number,number] = r === 'HIGH' || r === 'CRITICAL'
      ? RED_C : r.includes('MODERATE') ? [200,120,20] : r === 'LOW' || r === 'LOW RISK'
      ? GREEN : GRAY;
    const label = r === 'LOW RISK' || r === 'LOW' ? 'LOW RISK'
      : r === 'MODERATE' ? 'MODERATE' : r.includes('HIGH') ? 'HIGH' : r;
    fill(bg); doc.roundedRect(x, y - 4, 28, 6.5, 1.5, 1.5, 'F');
    col(WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(6.5);
    doc.text(label.slice(0, 12), x + 14, y + 0.5, { align:'center' });
  }

  function lsiBar(score: number, maxScore: number, y: number, label: string) {
    const pct = Math.min(score / maxScore, 1);
    const barW = 90;
    const barC: [number,number,number] = pct >= 0.75 ? GREEN : pct >= 0.5 ? AMBER : RED_C;

    col(NAVY); doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text(label, M, y + 3);

    // Background bar
    fill(LGRAY); doc.roundedRect(M + 55, y - 1, barW, 7, 1, 1, 'F');
    // Fill bar
    fill(barC); doc.roundedRect(M + 55, y - 1, Math.max(barW * pct, 2), 7, 1, 1, 'F');
    // Score text
    col(NAVY); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text(`${score} / ${maxScore}`, M + 150, y + 3);

    // Gauge dots (mimic the ████░░ pattern)
    const dots = 18, dotW = barW / dots;
    for (let d = 0; d < dots; d++) {
      if (d / dots > pct) {
        fill([220,222,226]); doc.rect(M + 55 + d * dotW + 0.5, y + 1.5, dotW - 1, 3.5, 'F');
      }
    }
    return y + 12;
  }

  // ── PAGE 1: COVER ───────────────────────────────────────────────────────────
  fill(NAVY); doc.rect(0, 0, W, H, 'F');
  fill(GOLD_C); doc.rect(0, 0, 2.5, H, 'F');
  // Gold accent top bar
  fill(GOLD_C); doc.rect(M, 28, CW, 0.8, 'F');

  // Brand label
  col(GOLD_C); doc.setFontSize(8.5); doc.setFont('helvetica','bold');
  doc.text('SRE — DISCOVERY REPUTATION SCAN', M, 22);
  col([160,170,185]); doc.setFontSize(7); doc.setFont('helvetica','normal');
  doc.text('Strategic Reputation Engineering', W - M, 22, { align:'right' });

  // Client name — large
  col(WHITE); doc.setFontSize(34); doc.setFont('helvetica','bold');
  doc.text(cl.name as string, M, 58);
  // Role
  col(GOLD_C); doc.setFontSize(12); doc.setFont('helvetica','normal');
  doc.text(`${cl.role ?? 'Leader'}, ${cl.company ?? ''}`, M, 70);
  // Context
  col([160,170,185]); doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text(`${cl.industry ?? ''} · Listening Period: ${listeningPeriod}`, M, 79);
  doc.text('Powered by ReputeOS', M, 86);

  // Divider
  fill([30,45,70]); doc.rect(M, 94, CW, 0.5, 'F');

  // LSI Hero Box
  fill([18,32,58]);
  doc.roundedRect(M, 104, CW, 52, 3, 3, 'F');
  stroke(GOLD_C); doc.setLineWidth(0.5);
  doc.roundedRect(M, 104, CW, 52, 3, 3);

  col([160,170,185]); doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.text('LSI BASELINE SCORE', M + CW/2, 115, { align:'center' });

  col(GOLD_C); doc.setFontSize(42); doc.setFont('helvetica','bold');
  doc.text(String(lsiScore), M + CW/2, 138, { align:'center' });

  col([160,170,185]); doc.setFontSize(9.5); doc.setFont('helvetica','normal');
  doc.text('/ 100', M + CW/2 + 20, 138);

  // Classification pill
  const cls = lsiClass(lsiScore);
  const pillColor: [number,number,number] = lsiScore >= 71 ? GREEN : lsiScore >= 56 ? AMBER : RED_C;
  fill(pillColor); doc.roundedRect(M + CW/2 - 30, 143, 60, 8, 4, 4, 'F');
  col(WHITE); doc.setFontSize(8.5); doc.setFont('helvetica','bold');
  doc.text(cls.toUpperCase(), M + CW/2, 148.5, { align:'center' });

  // Profile context box
  const ctx = (repDiagnosis.narrative as string)
    || (discReport.profile_overview && (discReport.profile_overview as JV).digital_presence_narrative as string)
    || `${cl.name} operates across ${cl.industry ?? 'multiple sectors'} with growing digital presence.`;

  fill([18,32,58]); doc.roundedRect(M, 168, CW, 50, 3, 3, 'F');
  col([160,170,185]); doc.setFontSize(7.5); doc.setFont('helvetica','bold');
  doc.text('PROFILE CONTEXT', M + 6, 177);
  col([210,220,235]); doc.setFontSize(8.5); doc.setFont('helvetica','normal');
  const ctxLines = doc.splitTextToSize(String(ctx).slice(0, 420), CW - 12) as string[];
  doc.text(ctxLines, M + 6, 185);

  // Footer
  col([80,95,120]); doc.setFontSize(7); doc.setFont('helvetica','normal');
  doc.text('CONFIDENTIAL | SRE Discovery Scan | ReputeOS | LSI Baseline: ' + lsiScore + '/100', M, H - 8);

  // ── PAGE 2: SOCIAL MEDIA + MENTION ANALYSIS ─────────────────────────────────
  addPage();
  let y = 22;

  y = sectionHeader('01 |', 'SOCIAL MEDIA & DIGITAL PRESENCE', y);

  // Platform table
  const linkedin = (platformAssess.linkedin as JV) ?? {};
  const twitter  = (platformAssess.twitter  as JV) ?? platformAssess.x as JV ?? {};
  const linkedinFollowers = (linkedin.followers as string) ?? '—';
  const twitterFollowers  = (twitter.followers  as string) ?? '—';
  const linkedinFreq      = (linkedin.post_frequency as string) ?? '—';
  const twitterFreq       = (twitter.post_frequency  as string) ?? '—';
  const linkedinTL        = (linkedin.thought_leadership_level as string) ?? 'Moderate';
  const twitterTL         = (twitter.thought_leadership_level  as string) ?? 'Moderate';

  // Platform header row
  y = tableRow(['METRIC', 'LINKEDIN', 'X / TWITTER', 'ASSESSMENT'], [55, 40, 40, 39], y, true);
  y = tableRow(['Followers', linkedinFollowers, twitterFollowers,
    lsiScore > 65 ? 'Strong base' : 'Growing base'], [55,40,40,39], y, false, false);
  y = tableRow(['Post Frequency', linkedinFreq, twitterFreq, 'Consistent volume'], [55,40,40,39], y, false, true);
  y = tableRow(['Thought Leadership', linkedinTL, twitterTL, 'Requires development'], [55,40,40,39], y, false, false);
  y += 6;

  // Content themes
  const liThemes = (linkedin.content_themes as string[]) ?? (discReport.social_and_thought_leadership
    && ((discReport.social_and_thought_leadership as JV).primary_content_themes as string[])) ?? [];
  const twThemes = (twitter.content_themes as string[]) ?? [];

  if (liThemes.length > 0 || twThemes.length > 0) {
    col(NAVY); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text('Primary Content Themes', M, y); y += 7;

    const themeColW = CW / 2 - 4;
    if (liThemes.length > 0) {
      col(NAVY2); doc.setFontSize(8); doc.setFont('helvetica','bold');
      doc.text('LinkedIn', M, y); y += 5;
      liThemes.slice(0,5).forEach(t => {
        col(GRAY); doc.setFontSize(8.5); doc.setFont('helvetica','normal');
        doc.text(`• ${t}`, M + 3, y); y += 5.5;
      });
    }
    if (twThemes.length > 0) {
      const twX = M + themeColW + 8;
      let ty = y - (liThemes.slice(0,5).length * 5.5 + 5 + 7);
      col(NAVY2); doc.setFontSize(8); doc.setFont('helvetica','bold');
      doc.text('X / Twitter', twX, ty); ty += 5;
      twThemes.slice(0,5).forEach(t => {
        col(GRAY); doc.setFontSize(8.5); doc.setFont('helvetica','normal');
        doc.text(`• ${t}`, twX + 3, ty); ty += 5.5;
      });
    }
    y += 4;
  }

  y += 4;
  y = sectionHeader('02 |', 'DIGITAL MENTION & FRAME ANALYSIS', y);

  // Mentions summary row
  const expertQuotes  = totalMentions > 0 ? Math.round(totalMentions * 0.003) : 0;
  const keynotes      = ((discReport.professional_background as JV)?.key_achievements as unknown[])?.length ?? 4;
  y = tableRow(['TOTAL MENTIONS', 'EXPERT QUOTES (period)', 'KEYNOTES (12 months)'], [60,60,54], y, true);
  y = tableRow([
    totalMentions > 0 ? totalMentions.toLocaleString() : '—',
    expertQuotes > 0 ? `${expertQuotes}–${expertQuotes + 3} expert quotes` : '—',
    `${keynotes > 0 ? keynotes : '—'}`,
  ], [60,60,54], y, false, false);
  y += 7;

  // Frame distribution
  col(NAVY); doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.text('MENTION FRAME DISTRIBUTION', M, y); y += 7;

  y = tableRow(['FRAME', 'DISTRIBUTION %', 'ASSESSMENT'], [60, 50, 64], y, true);
  const frames: Array<[string, string, string]> = [
    ['Family / Company Frame',
     frameDist.family !== undefined ? `~${Math.round((frameDist.family as number) * 100)}%` : '~45%',
     'Primary identity anchor — persists across all search results'],
    ['Expert / Professional Frame',
     frameDist.expert !== undefined ? `~${Math.round((frameDist.expert as number) * 100)}%` : '~25%',
     'Emerging — sector quoted but not yet owned domain'],
    ['Other Associations',
     frameDist.other !== undefined ? `~${Math.round((frameDist.other as number) * 100)}%` : '~30%',
     'Mixed signals — dilutes core narrative clarity'],
  ];
  frames.forEach(([f, d, a], i) => {
    y = tableRow([f, d, a], [60, 50, 64], y, false, i % 2 === 1);
  });

  // ── PAGE 3: SEARCH REPUTATION + RISK HEATMAP ────────────────────────────────
  addPage();
  y = 22;

  y = sectionHeader('03 |', 'SEARCH REPUTATION INDEX', y);

  // Search query analysis table
  y = tableRow(['SEARCH QUERY', 'PRIMARY EMPHASIS', 'SCORE', 'RATIONALE'], [45, 45, 20, 64], y, true);

  const queryData = searchQA.length > 0
    ? searchQA.slice(0, 6)
    : (searchRep.query_analysis as JV[])?.slice(0, 6) ?? [];

  if (queryData.length > 0) {
    queryData.forEach((q, i) => {
      const qr = q as JV;
      y = tableRow([
        (qr.query as string ?? '').slice(0, 30),
        (qr.dominant_signal as string ?? qr.primary_emphasis as string ?? '—').slice(0, 35),
        qr.score ? String(qr.score) : '—',
        (qr.insight as string ?? qr.rationale as string ?? '—').slice(0, 55),
      ], [45, 45, 20, 64], y, false, i % 2 === 1);
    });
  } else {
    // Fallback from component rationale
    const c1 = (lr.component_rationale as JV) ?? {};
    const searchNarrative = (c1.c1 as JV)?.narrative as string ?? 'Search identity analysis not yet available.';
    col(GRAY); doc.setFontSize(8.5); doc.setFont('helvetica','italic');
    const sn = doc.splitTextToSize(searchNarrative.slice(0,300), CW) as string[];
    doc.text(sn, M, y); y += sn.length * 5.5;
  }

  y += 8;
  y = sectionHeader('04 |', 'IDENTITY DEFINITION & RISK HEATMAP', y);

  // Risk heatmap table
  y = tableRow(['DIMENSION', 'CURRENT SIGNAL', 'RISK', 'ASSESSMENT NOTE'], [45, 40, 24, 65], y, true);

  const heatmapData = riskHeatmap.length > 0
    ? riskHeatmap.slice(0, 7)
    : (riskAssessment.layers as JV[])?.slice(0, 7) ?? [];

  if (heatmapData.length > 0) {
    heatmapData.forEach((row, i) => {
      const r = row as JV;
      const risk = (r.risk_level as string ?? r.gap_severity as string ?? 'MODERATE').toUpperCase();
      const rowY = y;
      if (i % 2 === 1) { fill(LGRAY); doc.rect(M, y - 4, CW, 9, 'F'); }
      col(NAVY); doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
      doc.text((r.dimension as string ?? r.authority_layer as string ?? '—').slice(0,28), M + 2, rowY);
      doc.text((r.current_signal as string ?? r.observable_signal as string ?? '—').slice(0,28), M + 47, rowY);
      riskBadge(risk, M + 87, rowY);
      const note = doc.splitTextToSize((r.assessment_note as string ?? r.narrative as string ?? '—').slice(0,65), 63) as string[];
      doc.text(note, M + 113, rowY);
      y += Math.max(9, note.length * 4.5);
    });
  }

  y += 6;
  // Strengths + Risk Factors side-by-side
  if (strengths.length > 0 || riskFactors.length > 0) {
    const halfW = CW / 2 - 4;

    col(GREEN[0] > 0 ? NAVY2 : NAVY2); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text('Identified Strengths', M, y);
    doc.text('Reputation Risk Factors', M + halfW + 8, y);
    y += 7;

    const strs  = strengths.slice(0, 4) as JV[];
    const risks = riskFactors.slice(0, 4) as JV[];
    const rows  = Math.max(strs.length, risks.length);

    for (let i = 0; i < rows; i++) {
      const str = strs[i];
      const rsk = risks[i];
      if (str) {
        col(GREEN); doc.setFontSize(8); doc.setFont('helvetica','normal');
        doc.text('•', M, y);
        col(NAVY); doc.setFontSize(8.5);
        const stxt = doc.splitTextToSize(`${str.title ?? str}: ${(str.description as string ?? '').slice(0,80)}`, halfW - 6) as string[];
        doc.text(stxt, M + 4, y);
      }
      if (rsk) {
        col(RED_C); doc.setFontSize(8); doc.setFont('helvetica','normal');
        doc.text('•', M + halfW + 8, y);
        col(NAVY); doc.setFontSize(8.5);
        const rtxt = doc.splitTextToSize(`${rsk.title ?? rsk}: ${(rsk.description as string ?? '').slice(0,80)}`, halfW - 6) as string[];
        doc.text(rtxt, M + halfW + 12, y);
      }
      y += 10;
    }
  }

  // ── PAGE 4: LSI BASELINE ────────────────────────────────────────────────────
  addPage();
  y = 22;

  y = sectionHeader('05 |', 'LEGITIMACY SCORE INDEX (LSI) — BASELINE', y);

  // Component bars
  const COMP_NAMES = [
    ['Search Reputation',         'c1', 20],
    ['Media Framing',             'c2', 20],
    ['Social Backlash Resistance','c3', 20],
    ['Elite Discourse',           'c4', 15],
    ['Third-Party Validation',    'c5', 15],
    ['Crisis Resistance & Moat',  'c6', 10],
  ] as [string, string, number][];

  COMP_NAMES.forEach(([name, key, max]) => {
    const score = Math.round((components[key] as number) ?? 0);
    y = lsiBar(score, max, y, name);
  });

  y += 4;
  // LSI Total hero
  fill(NAVY2); doc.roundedRect(M, y, CW, 22, 3, 3, 'F');
  col(GOLD_C); doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.text('LSI BASELINE SCORE', M + CW / 2, y + 8, { align:'center' });
  col(WHITE); doc.setFontSize(22); doc.setFont('helvetica','bold');
  doc.text(`${lsiScore} / 100`, M + CW / 2, y + 18, { align:'center' });
  y += 30;

  const cls2 = lsiClass(lsiScore);
  col(NAVY); doc.setFontSize(10); doc.setFont('helvetica','bold');
  doc.text(cls2, M + CW / 2, y, { align:'center' }); y += 10;

  // Archetype hypothesis
  if (archetype !== '—') {
    fill(LGRAY); doc.roundedRect(M, y, CW, 16, 2, 2, 'F');
    col(GRAY); doc.setFontSize(7.5); doc.setFont('helvetica','bold');
    doc.text('ARCHETYPE HYPOTHESIS', M + 6, y + 7);
    col(NAVY); doc.setFontSize(10); doc.setFont('helvetica','bold');
    const hypothText = bizArchetype ? `${archetype} + ${bizArchetype}` : archetype;
    doc.text(hypothText, M + 60, y + 7);
    col(GRAY); doc.setFontSize(8); doc.setFont('helvetica','normal');
    if (followability > 0) doc.text(`Followability: ${followability}%`, W - M - 4, y + 7, { align:'right' });
    y += 22;
  }

  // Component rationale (narrative per component)
  const compRationale = (lr.component_rationale as JV) ?? {};
  if (Object.keys(compRationale).length > 0) {
    col(NAVY); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text('Score Rationale', M, y); y += 8;
    COMP_NAMES.forEach(([name, key]) => {
      const rat = (compRationale[key] as JV);
      if (!rat) return;
      const narrative = rat.narrative as string ?? rat.gap as string ?? '';
      if (!narrative) return;
      col(NAVY2); doc.setFontSize(8.5); doc.setFont('helvetica','bold');
      doc.text(`${name}:`, M, y); y += 5;
      col(GRAY); doc.setFontSize(8); doc.setFont('helvetica','normal');
      const lines = doc.splitTextToSize(narrative.slice(0, 180), CW) as string[];
      doc.text(lines, M + 3, y); y += lines.length * 4.5 + 4;
    });
  }

  // ── PAGE 5: INTERVENTIONS + STRATEGY ────────────────────────────────────────
  addPage();
  y = 22;

  y = sectionHeader('06 |', 'SRE INTERVENTION OPPORTUNITIES', y);

  // Gap-based interventions
  const earlyActions  = (interventionPlan['0_3_months']  as string[]) ?? (interventionPlan['early']  as string[]) ?? [];
  const midActions    = (interventionPlan['3_9_months']  as string[]) ?? (interventionPlan['mid']    as string[]) ?? [];
  const longActions   = (interventionPlan['9_12_months'] as string[]) ?? (interventionPlan['long']   as string[]) ?? [];
  const gapActions    = gaps.slice(0, 5).map(g => `Improve ${g.component ?? g}: currently ${g.current ?? '—'}/${g.max ?? '—'} — ${g.recommendation ?? 'needs focused effort'}`);

  const allOpps = [...earlyActions, ...gapActions].filter(Boolean);
  if (allOpps.length > 0) {
    allOpps.slice(0, 5).forEach(opp => {
      fill(LGRAY); doc.roundedRect(M, y - 4, CW, 10, 1.5, 1.5, 'F');
      stroke(GOLD_C); doc.setLineWidth(0.3);
      doc.roundedRect(M, y - 4, CW, 10, 1.5, 1.5);
      fill(GOLD_C); doc.roundedRect(M, y - 4, 3, 10, 0, 0, 'F');
      col(NAVY); doc.setFontSize(8.5); doc.setFont('helvetica','normal');
      const olines = doc.splitTextToSize(String(opp).slice(0, 200), CW - 10) as string[];
      doc.text(olines, M + 7, y + 2);
      y += Math.max(12, olines.length * 5 + 8);
    });
  }

  // Phased action plan
  if (midActions.length > 0 || longActions.length > 0) {
    y += 4;
    col(NAVY); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text('Phased Action Plan', M, y); y += 8;

    const phases = [
      { label:'0–3 Months', items: earlyActions, color: GREEN },
      { label:'3–9 Months', items: midActions,   color: AMBER },
      { label:'9–12 Months',items: longActions,   color: RED_C },
    ].filter(p => p.items.length > 0);

    phases.forEach(phase => {
      col(phase.color); doc.setFontSize(8.5); doc.setFont('helvetica','bold');
      doc.text(phase.label, M, y); y += 6;
      phase.items.slice(0, 3).forEach(item => {
        col(GRAY); doc.setFontSize(8); doc.setFont('helvetica','normal');
        const ilines = doc.splitTextToSize(`• ${String(item).slice(0, 180)}`, CW) as string[];
        doc.text(ilines, M + 3, y); y += ilines.length * 5 + 2;
      });
      y += 4;
    });
  }

  y += 4;
  y = sectionHeader('07 |', 'STRATEGIC INSIGHT & RECOMMENDED ACTION', y);

  // Key strategic insight
  const diagHeadline  = (repDiagnosis.headline    as string) ?? '';
  const diagNarrative = (repDiagnosis.narrative   as string) ?? '';
  const sreOppty      = (repDiagnosis.opportunity_signal as string) ?? '';
  const sreRating     = (repDiagnosis.sre_opportunity_rating as string) ?? '';

  if (diagHeadline || diagNarrative) {
    fill(LGRAY); doc.roundedRect(M, y - 4, CW, diagHeadline ? 36 : 26, 2, 2, 'F');
    stroke([200, 165, 50]); doc.setLineWidth(0.4);
    doc.roundedRect(M, y - 4, CW, diagHeadline ? 36 : 26, 2, 2);
    col(GOLD_C); doc.setFontSize(7.5); doc.setFont('helvetica','bold');
    doc.text('KEY STRATEGIC INSIGHT', M + 5, y + 2);
    if (diagHeadline) {
      col(NAVY); doc.setFontSize(10); doc.setFont('helvetica','bold');
      const hlines = doc.splitTextToSize(diagHeadline.slice(0, 200), CW - 10) as string[];
      doc.text(hlines, M + 5, y + 9); y += hlines.length * 5;
    }
    if (diagNarrative) {
      col(GRAY); doc.setFontSize(8); doc.setFont('helvetica','normal');
      const nlines = doc.splitTextToSize(diagNarrative.slice(0, 400), CW - 10) as string[];
      doc.text(nlines, M + 5, y + 12); y += nlines.length * 4.5 + 6;
    }
    y += 14;
  }

  // Recommended SRE Action
  if (posStatement) {
    col(NAVY); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text('RECOMMENDED SRE ACTION', M, y); y += 7;

    fill(NAVY2); doc.roundedRect(M, y - 4, CW, 16, 2, 2, 'F');
    col(WHITE); doc.setFontSize(9); doc.setFont('helvetica','normal');
    const pslines = doc.splitTextToSize(`"${posStatement}"`, CW - 10) as string[];
    doc.text(pslines, M + 5, y + 5); y += pslines.length * 5.5 + 14;
  }

  // SRE Opportunity Rating
  if (sreRating || sreOppty) {
    const ratingColor: [number,number,number] = sreRating === 'Exceptional' ? GREEN : sreRating === 'High' ? AMBER : GRAY;
    fill(LGRAY); doc.roundedRect(M, y - 4, CW, 20, 2, 2, 'F');
    col(NAVY); doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.text('SRE OPPORTUNITY RATING', M + 5, y + 4);
    if (sreRating) {
      col(ratingColor); doc.setFontSize(14); doc.setFont('helvetica','bold');
      doc.text(sreRating, M + 5, y + 14);
    }
    if (sreOppty) {
      col(GRAY); doc.setFontSize(8); doc.setFont('helvetica','normal');
      const olines = doc.splitTextToSize(sreOppty.slice(0, 180), CW - 60) as string[];
      doc.text(olines, M + 55, y + 10);
    }
    y += 28;
  }

  // Content pillars
  if (contentPillars.length > 0) {
    col(NAVY); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text('CONTENT PILLAR STRATEGY', M, y); y += 8;
    y = tableRow(['PILLAR', 'THEMES', 'CADENCE', 'FORMATS'], [40, 60, 28, 46], y, true);
    contentPillars.slice(0, 5).forEach((p, i) => {
      const pj = p as JV;
      y = tableRow([
        String(pj.name ?? '').slice(0, 25),
        ((pj.themes as string[]) ?? []).slice(0, 3).join(', ').slice(0, 50),
        String(pj.frequency ?? '—').slice(0, 20),
        ((pj.formats as string[]) ?? []).slice(0, 2).join(', ').slice(0, 40),
      ], [40, 60, 28, 46], y, false, i % 2 === 1);
    });
  }

  // ── OUTPUT ──────────────────────────────────────────────────────────────────
  const buffer = Buffer.from(doc.output('arraybuffer'));
  const filename = `${String(cl.name ?? 'Report').replace(/\s+/g, '_')}_SRE_Scan_${new Date().toISOString().slice(0,10)}.pdf`;

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
