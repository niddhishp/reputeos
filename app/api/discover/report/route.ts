/**
 * POST /api/discover/report
 * Generates (or regenerates) the full 10-section SRE Discovery Report
 * for a completed discover run. Runs independently from the scan so it
 * gets its own Vercel function timeout budget (120 s).
 *
 * Can be called:
 *  (a) automatically by the discover page when scanRun.discovery_report is null
 *  (b) manually via a "Generate Report" button
 */

import { createClient, createAdminClient, verifyClientOwnership } from '@/lib/supabase/server';
import { callAI, parseAIJson }   from '@/lib/ai/call';
import { buildDiscoveryReportPrompts } from '../sources/discovery-report-prompt';
import type { DiscoveryReport }  from '../sources/discovery-report-prompt';
import { z } from 'zod';

const Schema = z.object({ clientId: z.string().uuid() });

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });

  const { clientId } = parsed.data;
  const isOwner = await verifyClientOwnership(clientId);
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 });

  // Load client
  const { data: client } = await supabase
    .from('clients')
    .select('name, role, company, industry, keywords, linkedin_url')
    .eq('id', clientId)
    .maybeSingle();
  if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

  // Load latest completed scan
  const { data: run } = await supabase
    .from('discover_runs')
    .select('id, total_mentions, sentiment_summary, frame_distribution, top_keywords, crisis_signals, archetype_hints, lsi_preliminary, module_summary')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!run) return Response.json({ error: 'No completed scan found. Run a discovery scan first.' }, { status: 404 });

  // Build input for report generator
  const sentiment = (run.sentiment_summary as Record<string, number>) ?? { positive: 0, neutral: 100, negative: 0 };
  const frames    = (run.frame_distribution as Record<string, number>) ?? {};

  const input = {
    client: {
      name:        client.name,
      role:        client.role        ?? '',
      company:     client.company     ?? '',
      industry:    client.industry    ?? '',
      keywords:    (client.keywords   as string[]) ?? [],
      linkedin_url: client.linkedin_url ?? undefined,
    },
    total_mentions:  run.total_mentions ?? 0,
    top_mentions:    [],   // AI uses its own knowledge; scan mentions are supplementary
    sentiment:       { positive: sentiment.positive ?? 0, neutral: sentiment.neutral ?? 100, negative: sentiment.negative ?? 0 },
    frames:          { expert: frames.expert ?? 0, founder: frames.founder ?? 0, leader: frames.leader ?? 0, family: frames.family ?? 0, crisis: frames.crisis ?? 0, other: frames.other ?? 100 },
    top_keywords:    (run.top_keywords  as string[]) ?? [],
    crisis_signals:  (run.crisis_signals as string[]) ?? [],
    archetype_hints: (run.archetype_hints as string[]) ?? [],
    lsi_preliminary: run.lsi_preliminary ?? 0,
  };

  const { systemPrompt, userPrompt } = buildDiscoveryReportPrompts(input);

  try {
    const result = await callAI({
      systemPrompt,
      userPrompt,
      maxTokens:   8000,
      temperature: 0.3,
      json:    true,
      timeoutMs:   110_000,
    });

    const report = parseAIJson<DiscoveryReport>(result.content);
    report.generated_at = new Date().toISOString();

    // Save to discover_runs
    const admin = createAdminClient();
    await admin
      .from('discover_runs')
      .update({ discovery_report: report })
      .eq('id', run.id);

    return Response.json({ success: true, report });
  } catch (e) {
    console.error('[ReputeOS] Report generation failed:', e instanceof Error ? e.message : e);
    return Response.json(
      { error: 'Report generation failed', detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
