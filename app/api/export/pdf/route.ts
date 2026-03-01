/**
 * PDF Export Route
 * POST /api/export/pdf
 *
 * Generates a board-ready PDF report using jsPDF.
 * Covers: LSI baseline→current, component breakdown, frame shift, stats.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, verifyClientOwnership } from '@/lib/supabase/server';

const Schema = z.object({
  clientId:   z.string().uuid(),
  reportType: z.enum(['monthly', 'board', 'investor', 'case_study']).default('board'),
  period:     z.enum(['last_month', 'last_quarter', 'last_year', 'full_engagement']).default('full_engagement'),
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

  const { clientId, reportType } = parsed.data;
  const isOwner = await verifyClientOwnership(clientId);
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Fetch data
  const [{ data: client }, { data: lsiRuns }, { data: positioning }, { data: discoverRuns }] = await Promise.all([
    supabase.from('clients').select('name, role, industry, company, baseline_lsi, target_lsi').eq('id', clientId).single(),
    supabase.from('lsi_runs').select('run_date, total_score, components').eq('client_id', clientId).order('run_date', { ascending: true }).limit(24),
    supabase.from('positioning').select('personal_archetype, followability_score, content_pillars').eq('client_id', clientId).maybeSingle(),
    supabase.from('discover_runs').select('frame_dist, total_mentions').eq('client_id', clientId).eq('status', 'completed').order('created_at', { ascending: true }).limit(2),
  ]);

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const baseline    = lsiRuns?.[0];
  const current     = lsiRuns?.[lsiRuns.length - 1];
  const improvement = current && baseline ? Math.round(current.total_score - baseline.total_score) : 0;
  const targetLSI   = (client as Record<string,unknown>).target_lsi as number ?? 75;

  // Component breakdown
  const COMP_NAMES = ['Search Rep.', 'Media Frame', 'Social', 'Elite Disc.', '3rd Party', 'Crisis Moat'];
  const baseComps  = (baseline?.components as Record<string,number>) ?? {};
  const currComps  = (current?.components  as Record<string,number>) ?? {};

  // Dynamic import jsPDF (avoid build-time issues)
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const BG_R = 8, BG_G = 12, BG_B = 20;       // #080C14
  const GOLD_R = 201, GOLD_G = 168, GOLD_B = 76;
  const W = 210, H = 297;
  const margin = 20;

  function setGold()  { doc.setTextColor(GOLD_R, GOLD_G, GOLD_B); }
  function setWhite() { doc.setTextColor(255, 255, 255); }
  function setDim()   { doc.setTextColor(156, 163, 175); }

  function bgRect(x: number, y: number, w: number, h: number, r = 0, g = 13, b = 17) {
    doc.setFillColor(r, g, b);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
  }

  function goldRect(x: number, y: number, w: number, h: number) {
    doc.setFillColor(GOLD_R, GOLD_G, GOLD_B);
    doc.rect(x, y, w, h, 'F');
  }

  // ── Page 1: Cover ──────────────────────────────────────────────────────────
  doc.setFillColor(BG_R, BG_G, BG_B);
  doc.rect(0, 0, W, H, 'F');

  // Gold accent bar left
  goldRect(0, 0, 3, H);

  setGold(); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('REPUTEOS', margin, 28);

  setWhite(); doc.setFontSize(32); doc.setFont('helvetica', 'bold');
  doc.text('Reputation Engineering', margin, 70);
  doc.text('Results Report', margin, 84);

  setGold(); doc.setFontSize(14); doc.setFont('helvetica', 'normal');
  doc.text(client.name as string, margin, 104);

  setDim(); doc.setFontSize(10);
  doc.text(`${(client.role as string) ?? 'Leader'} · ${(client.company as string) ?? ''}`, margin, 112);
  doc.text(`${reportType.replace('_', ' ').toUpperCase()} REPORT  |  ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, margin, 128);

  // Score hero box
  bgRect(margin, 150, W - 2 * margin, 50, 20, 25, 30);
  doc.setDrawColor(GOLD_R, GOLD_G, GOLD_B);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, 150, W - 2 * margin, 50, 2, 2);

  const boxW = (W - 2 * margin) / 3;
  // Baseline
  setDim(); doc.setFontSize(8); doc.text('BASELINE LSI', margin + boxW * 0 + boxW / 2, 160, { align: 'center' });
  setWhite(); doc.setFontSize(28); doc.setFont('helvetica', 'bold');
  doc.text(baseline ? String(Math.round(baseline.total_score)) : '—', margin + boxW * 0 + boxW / 2, 180, { align: 'center' });

  // Current
  setGold(); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('CURRENT LSI', margin + boxW * 1 + boxW / 2, 160, { align: 'center' });
  setGold(); doc.setFontSize(28); doc.setFont('helvetica', 'bold');
  doc.text(current ? String(Math.round(current.total_score)) : '—', margin + boxW * 1 + boxW / 2, 180, { align: 'center' });

  // Improvement
  const impColor = improvement > 0 ? [16, 185, 129] : [156, 163, 175];
  doc.setTextColor(impColor[0], impColor[1], impColor[2]);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('IMPROVEMENT', margin + boxW * 2 + boxW / 2, 160, { align: 'center' });
  doc.setFontSize(28); doc.setFont('helvetica', 'bold');
  doc.text(improvement > 0 ? `+${improvement}` : String(improvement), margin + boxW * 2 + boxW / 2, 180, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('points', margin + boxW * 2 + boxW / 2, 191, { align: 'center' });

  // Footer
  setDim(); doc.setFontSize(8);
  doc.text('Confidential — Generated by ReputeOS', margin, H - 10);
  doc.text(new Date().toLocaleDateString(), W - margin, H - 10, { align: 'right' });

  // ── Page 2: Component Breakdown ───────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(BG_R, BG_G, BG_B);
  doc.rect(0, 0, W, H, 'F');
  goldRect(0, 0, 3, H);

  setWhite(); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text('LSI Component Analysis', margin, 25);

  setGold(); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`Baseline → Current across all 6 components`, margin, 33);

  const keys = ['c1','c2','c3','c4','c5','c6'];
  const MAXES = [20, 20, 20, 15, 15, 10];
  let y = 48;

  keys.forEach((k, i) => {
    const base = baseComps[k] ?? 0;
    const curr = currComps[k] ?? 0;
    const max  = MAXES[i];
    const diff = curr - base;
    const barW = W - 2 * margin - 60;

    // Label
    setWhite(); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(COMP_NAMES[i], margin, y + 5);
    setDim(); doc.setFontSize(8);
    doc.text(`Max: ${max}`, margin + 42, y + 5);

    // Bar background
    doc.setFillColor(30, 35, 45);
    doc.roundedRect(margin + 55, y, barW, 8, 1, 1, 'F');

    // Baseline bar
    doc.setFillColor(60, 65, 80);
    const baseBarW = (base / max) * barW;
    doc.roundedRect(margin + 55, y, baseBarW, 8, 1, 1, 'F');

    // Current bar
    doc.setFillColor(GOLD_R, GOLD_G, GOLD_B);
    const currBarW = (curr / max) * barW;
    doc.roundedRect(margin + 55, y, currBarW, 4, 1, 1, 'F');

    // Values
    setWhite(); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(`${curr.toFixed(1)}`, W - margin - 28, y + 6);
    const diffColor = diff > 0 ? [16, 185, 129] : diff < 0 ? [248, 113, 113] : [156, 163, 175];
    doc.setTextColor(diffColor[0], diffColor[1], diffColor[2]);
    doc.setFontSize(8);
    doc.text(diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1), W - margin - 10, y + 6, { align: 'right' });

    y += 18;
  });

  // Archetype section
  if (positioning) {
    y += 10;
    bgRect(margin, y, W - 2 * margin, 40, 20, 25, 30);
    doc.setDrawColor(GOLD_R, GOLD_G, GOLD_B);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, W - 2 * margin, 40, 2, 2);

    setGold(); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('ARCHETYPE', margin + 6, y + 10);
    setWhite(); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text((positioning.personal_archetype as string) ?? '—', margin + 6, y + 22);

    setGold(); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('FOLLOWABILITY', W / 2, y + 10);
    setWhite(); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(`${positioning.followability_score ?? '—'}%`, W / 2, y + 22);

    setGold(); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('TARGET LSI', W * 0.75, y + 10);
    setWhite(); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(String(targetLSI), W * 0.75, y + 22);
  }

  // ── Page 3: Next Steps ────────────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(BG_R, BG_G, BG_B);
  doc.rect(0, 0, W, H, 'F');
  goldRect(0, 0, 3, H);

  setWhite(); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text('Recommended Actions', margin, 25);

  const actions = [
    'Continue publishing 2–3 thought leadership pieces per week aligned to content pillars.',
    `Focus on the lowest-scoring LSI components to close the gap to target (${targetLSI}).`,
    'Monitor SHIELD alerts and respond to critical notifications within 24 hours.',
    'Schedule next LSI recalculation in 30 days to track progress.',
    'Run Discovery scan monthly to refresh mention data and recalibrate positioning.',
  ];

  let ay = 48;
  actions.forEach((action, i) => {
    // Number circle
    doc.setFillColor(GOLD_R, GOLD_G, GOLD_B);
    doc.circle(margin + 4, ay, 4, 'F');
    doc.setTextColor(BG_R, BG_G, BG_B);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text(String(i + 1), margin + 4, ay + 1.5, { align: 'center' });

    setWhite(); doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(action, W - 2 * margin - 20) as string[];
    doc.text(lines, margin + 14, ay + 1.5);
    ay += lines.length * 7 + 8;
  });

  // Content pillars
  const pillars = (positioning?.content_pillars as Array<{ name: string; frequency: string }>) ?? [];
  if (pillars.length > 0) {
    ay += 10;
    setGold(); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Active Content Pillars', margin, ay);
    ay += 10;

    pillars.slice(0, 5).forEach(p => {
      bgRect(margin, ay, W - 2 * margin, 14, 20, 25, 30);
      doc.setDrawColor(GOLD_R, GOLD_G, GOLD_B);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, ay, W - 2 * margin, 14, 1, 1);

      setWhite(); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(p.name, margin + 6, ay + 9);
      setDim(); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text(p.frequency ?? '', W - margin - 6, ay + 9, { align: 'right' });
      ay += 17;
    });
  }

  // Footer
  setDim(); doc.setFontSize(8);
  doc.text('Confidential — Generated by ReputeOS', margin, H - 10);
  doc.text(new Date().toLocaleDateString(), W - margin, H - 10, { align: 'right' });

  // Output
  const buffer = Buffer.from(doc.output('arraybuffer'));
  const filename = `${((client.name as string) ?? 'ReputeOS').replace(/\s+/g, '_')}_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
