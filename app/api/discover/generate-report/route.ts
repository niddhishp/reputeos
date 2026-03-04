/**
 * POST /api/discover/generate-report
 * Called by the frontend after a scan completes to generate (or regenerate)
 * the full SRE narrative report. Runs independently of the scan function
 * so it gets its own Vercel function timeout budget.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDiscoveryReport } from '../sources/ai-analysis';

const adminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

export const maxDuration = 120; // seconds — Vercel Pro function budget

export async function POST(req: Request) {
  try {
    const body = await req.json() as { runId: string; clientId: string; force?: boolean };
    const { runId, clientId, force = false } = body;
    if (!runId || !clientId) return NextResponse.json({ error: 'runId and clientId required' }, { status: 400 });

    const admin = adminClient();

    // Load the scan run + client in parallel
    const [{ data: run }, { data: client }] = await Promise.all([
      admin.from('discover_runs').select('*').eq('id', runId).maybeSingle(),
      admin.from('clients').select('*').eq('id', clientId).maybeSingle(),
    ]);

    if (!run || !client) return NextResponse.json({ error: 'Run or client not found' }, { status: 404 });
    if (run.status !== 'completed') return NextResponse.json({ error: 'Scan not completed yet' }, { status: 400 });

    // If report already exists and caller didn't force regenerate, return it
    if (run.discovery_report && !force) {
      return NextResponse.json({ report: run.discovery_report, cached: true });
    }

    // Build mention sample from stored mentions
    const storedMentions = (run.top_mentions as Array<Record<string,unknown>> | null) ?? [];
    const topMentionsSample = storedMentions.slice(0, 25).map(m => ({
      source:    String(m.source    ?? ''),
      title:     String(m.title     ?? ''),
      snippet:   String(m.snippet   ?? '').slice(0, 300),
      sentiment: Number(m.sentiment ?? 0),
      frame:     String(m.frame     ?? 'other'),
    }));

    const sentimentRaw = (run.sentiment_summary as Record<string,number>) ?? {};
    const sentiment = { positive: Number(sentimentRaw.positive ?? 0), neutral: Number(sentimentRaw.neutral ?? 100), negative: Number(sentimentRaw.negative ?? 0) };
    const frames     = (run.frame_distribution as Record<string,number>) ?? {};
    const framesNorm = {
      expert:  frames.expert  ?? 0,
      founder: frames.founder ?? 0,
      leader:  frames.leader  ?? 0,
      family:  frames.family  ?? 0,
      crisis:  frames.crisis  ?? 0,
      other:   frames.other   ?? 100,
    };

    const report = await generateDiscoveryReport({
      client: {
        name:        client.name,
        role:        client.role || '',
        company:     client.company || '',
        industry:    client.industry || '',
        keywords:    client.keywords || [],
        linkedin_url: client.linkedin_url ?? undefined,
      },
      total_mentions:  run.total_mentions ?? storedMentions.length,
      top_mentions:    topMentionsSample,
      sentiment,
      frames:          framesNorm,
      top_keywords:    (run.top_keywords as string[]) ?? [],
      crisis_signals:  (run.crisis_signals as string[]) ?? [],
      archetype_hints: [],
      lsi_preliminary: run.lsi_preliminary ?? 0,
    });

    if (!report) {
      return NextResponse.json({ error: 'Report generation failed — AI service returned empty response' }, { status: 500 });
    }

    // Save back to the run
    await admin.from('discover_runs').update({ discovery_report: report }).eq('id', runId);

    return NextResponse.json({ report, cached: false });
  } catch (e) {
    console.error('[generate-report]', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
