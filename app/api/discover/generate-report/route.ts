/**
 * POST /api/discover/generate-report
 *
 * Multi-agent discovery report generation:
 *   6 specialist agents run in parallel (profile, career, search, media, social, peers)
 *   1 synthesis agent reads all outputs → final risk assessment + diagnosis
 *
 * Total time: ~60-90s (parallel) vs 120-180s (serial)
 * Total output: ~12,000 tokens across all agents vs 8,000 single call
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDiscoveryReportAgentically } from '@/lib/ai/agents/discovery-agents';

export const maxDuration = 300;

const adminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

export async function POST(req: Request) {
  try {
    const body = await req.json() as { runId: string; clientId: string; force?: boolean };
    const { runId, clientId, force = false } = body;
    if (!runId || !clientId) return NextResponse.json({ error: 'runId and clientId required' }, { status: 400 });

    const admin = adminClient();
    const [{ data: run }, { data: client }] = await Promise.all([
      admin.from('discover_runs').select('*').eq('id', runId).maybeSingle(),
      admin.from('clients').select('*').eq('id', clientId).maybeSingle(),
    ]);

    if (!run || !client) return NextResponse.json({ error: 'Run or client not found' }, { status: 404 });
    if (run.status !== 'completed') return NextResponse.json({ error: 'Scan not completed yet' }, { status: 400 });
    if (run.discovery_report && !force) return NextResponse.json({ report: run.discovery_report, cached: true });

    const sentiment = (run.sentiment_summary as Record<string,number>) ?? {};
    const frames    = (run.frame_distribution as Record<string,number>) ?? {};

    const report = await generateDiscoveryReportAgentically({
      client: {
        name:         client.name,
        role:         client.role        ?? '',
        company:      client.company     ?? '',
        industry:     client.industry    ?? '',
        keywords:     (client.keywords   as string[]) ?? [],
        linkedin_url: client.linkedin_url ?? undefined,
      },
      total_mentions:  run.total_mentions  ?? 0,
      top_mentions:    [],
      sentiment:       { positive: sentiment.positive ?? 0, neutral: sentiment.neutral ?? 100, negative: sentiment.negative ?? 0 },
      frames:          { expert: frames.expert ?? 0, founder: frames.founder ?? 0, leader: frames.leader ?? 0, family: frames.family ?? 0, crisis: frames.crisis ?? 0, other: frames.other ?? 100 },
      top_keywords:    (run.top_keywords   as string[]) ?? [],
      crisis_signals:  (run.crisis_signals as string[]) ?? [],
      archetype_hints: [],
      lsi_preliminary: run.lsi_preliminary ?? 0,
    });

    await admin.from('discover_runs').update({ discovery_report: report }).eq('id', runId);
    return NextResponse.json({ report, cached: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[generate-report] FAILED:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
