// app/api/export/pptx/route.ts
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  clientId: z.string().uuid(),
  reportType: z.enum(['monthly', 'board', 'investor', 'case_study']).default('board'),
  period: z.enum(['last_month', 'last_quarter', 'last_year', 'full_engagement']).default('last_quarter'),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { clientId, reportType, period } = parsed.data;

    const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).eq('user_id', user.id).single();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const { data: lsiRuns } = await supabase
      .from('lsi_runs')
      .select('*')
      .eq('client_id', clientId)
      .order('run_date', { ascending: true });

    // Dynamic import to avoid edge runtime issues
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();

    pptx.layout = 'LAYOUT_WIDE';
    pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });

    const BG = '080C14';
    const GOLD = 'C9A84C';
    const WHITE = 'FFFFFF';
    const DIM = '9CA3AF';

    const baseline = lsiRuns?.[0];
    const current = lsiRuns?.[lsiRuns.length - 1];
    const improvement = current && baseline ? Math.round(current.total_score - baseline.total_score) : 0;

    // Slide 1: Title
    const s1 = pptx.addSlide();
    s1.background = { color: BG };
    s1.addText('ReputeOS', { x: 0.6, y: 0.6, w: 4, h: 0.4, fontSize: 13, color: GOLD, bold: true });
    s1.addText('Reputation Engineering Results', { x: 0.6, y: 1.4, w: 10, h: 1.2, fontSize: 44, bold: true, color: WHITE });
    s1.addText(client.name, { x: 0.6, y: 2.8, w: 10, h: 0.6, fontSize: 28, color: DIM });
    s1.addText(`${reportType.replace('_', ' ').toUpperCase()} REPORT  |  ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, { x: 0.6, y: 6.6, w: 10, h: 0.35, fontSize: 12, color: GOLD });

    // Slide 2: LSI Score
    const s2 = pptx.addSlide();
    s2.background = { color: BG };
    s2.addText('LSI Score Movement', { x: 0.6, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true, color: WHITE });
    s2.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.2, w: 3.5, h: 2.5, fill: { color: '0D1117' }, line: { color: '1F2937', width: 1 } });
    s2.addText('BASELINE', { x: 0.6, y: 1.3, w: 3.5, h: 0.35, align: 'center', fontSize: 11, color: DIM });
    s2.addText(baseline ? String(Math.round(baseline.total_score)) : '—', { x: 0.6, y: 1.7, w: 3.5, h: 1.2, align: 'center', fontSize: 56, bold: true, color: DIM });
    s2.addShape(pptx.ShapeType.rect, { x: 4.8, y: 1.2, w: 3.5, h: 2.5, fill: { color: '0D1117' }, line: { color: GOLD, width: 1 } });
    s2.addText('CURRENT', { x: 4.8, y: 1.3, w: 3.5, h: 0.35, align: 'center', fontSize: 11, color: GOLD });
    s2.addText(current ? String(Math.round(current.total_score)) : '—', { x: 4.8, y: 1.7, w: 3.5, h: 1.2, align: 'center', fontSize: 56, bold: true, color: WHITE });
    s2.addShape(pptx.ShapeType.rect, { x: 9.0, y: 1.2, w: 3.5, h: 2.5, fill: { color: improvement > 0 ? '064E3B' : '1F2937' }, line: { color: improvement > 0 ? '10B981' : '374151', width: 1 } });
    s2.addText('IMPROVEMENT', { x: 9.0, y: 1.3, w: 3.5, h: 0.35, align: 'center', fontSize: 11, color: improvement > 0 ? '10B981' : DIM });
    s2.addText(improvement > 0 ? `+${improvement}` : String(improvement), { x: 9.0, y: 1.7, w: 3.5, h: 1.2, align: 'center', fontSize: 56, bold: true, color: improvement > 0 ? '10B981' : DIM });
    s2.addText('points', { x: 9.0, y: 2.9, w: 3.5, h: 0.4, align: 'center', fontSize: 14, color: DIM });

    // Slide 3: What this means
    const s3 = pptx.addSlide();
    s3.background = { color: BG };
    s3.addText('What this means for your career', { x: 0.6, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true, color: WHITE });
    const bullets = [
      'Search results increasingly frame you as a credible expert in your domain',
      'Media coverage shifted toward authoritative expert positioning',
      'Your content strategy is generating measurable follower growth',
      'Crisis detection is actively monitoring 50+ sources 24/7',
    ];
    bullets.forEach((b, i) => {
      s3.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.4 + i * 1.2, w: 0.05, h: 0.8, fill: { color: GOLD } });
      s3.addText(b, { x: 0.9, y: 1.4 + i * 1.2, w: 11.7, h: 0.8, fontSize: 16, color: 'D1D5DB', valign: 'middle' });
    });

    // Slide 4: Next steps
    const s4 = pptx.addSlide();
    s4.background = { color: BG };
    s4.addText('Recommended Next Steps', { x: 0.6, y: 0.4, w: 12, h: 0.6, fontSize: 28, bold: true, color: WHITE });
    const steps = ['Continue publishing 2–3 thought leadership pieces per week', 'Focus content on the top 2 gap components identified in DIAGNOSE', 'Monitor SHIELD alerts and respond within 24 hours', 'Schedule next LSI recalculation in 30 days'];
    steps.forEach((step, i) => {
      s4.addShape(pptx.ShapeType.ellipse, { x: 0.6, y: 1.5 + i * 1.3, w: 0.45, h: 0.45, fill: { color: GOLD } });
      s4.addText(String(i + 1), { x: 0.6, y: 1.5 + i * 1.3, w: 0.45, h: 0.45, align: 'center', valign: 'middle', fontSize: 14, bold: true, color: BG });
      s4.addText(step, { x: 1.3, y: 1.5 + i * 1.3, w: 11, h: 0.6, fontSize: 16, color: 'D1D5DB', valign: 'middle' });
    });
    s4.addText('Powered by ReputeOS', { x: 0.6, y: 6.8, w: 12, h: 0.3, fontSize: 11, color: GOLD, align: 'right' });

    const buffer = await pptx.write({ outputType: 'arraybuffer' });

    const filename = `${client.name.replace(/\s+/g, '_')}_ReputeOS_${reportType}_${new Date().toISOString().slice(0, 10)}.pptx`;

    return new Response(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[export/pptx]', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
