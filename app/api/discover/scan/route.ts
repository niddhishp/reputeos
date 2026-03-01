/**
 * Discover Scan API — 62-Source Parallel Engine
 *
 * POST /api/discover/scan
 * Runs all 62 sources across 7 parallel modules.
 * Live progress updates via Supabase Realtime.
 * Full AI analysis via OpenRouter (DeepSeek + GPT-4o-mini + Claude Haiku).
 */

import { createClient, createAdminClient, verifyClientOwnership } from '@/lib/supabase/server';
import { z } from 'zod';
import { ClientProfile, SourceResult } from '../sources/types';
import { fetchSearchSources } from '../sources/search';
import { fetchNewsSources } from '../sources/news';
import { fetchSocialSources } from '../sources/social';
import { fetchFinancialSources } from '../sources/financial';
import { fetchRegulatorySources } from '../sources/regulatory';
import { fetchAcademicSources } from '../sources/academic';
import { fetchVideoSources } from '../sources/video';
import { runFullAnalysis } from '../sources/ai-analysis';

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

  const { data: clientData } = await supabase
    .from('clients')
    .select('name, company, role, industry, linkedin_url, keywords')
    .eq('id', clientId)
    .single();

  if (!clientData) return Response.json({ error: 'Client not found' }, { status: 404 });

  const client: ClientProfile = {
    name: clientData.name,
    company: clientData.company,
    role: clientData.role,
    industry: clientData.industry,
    linkedin_url: clientData.linkedin_url,
    keywords: clientData.keywords,
  };

  const admin = createAdminClient();
  const { data: run, error: runError } = await admin
    .from('discover_runs')
    .insert({
      client_id: clientId,
      status: 'running',
      progress: 5,
      sources_total: 62,
      sources_completed: 0,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (runError || !run) {
    return Response.json({ error: 'Failed to create scan record', message: runError?.message }, { status: 500 });
  }

  runScan(run.id, clientId, client, admin).catch(err => {
    console.error('Scan failed:', err);
    admin.from('discover_runs').update({
      status: 'failed',
      error_message: String(err?.message ?? 'Unknown error'),
      completed_at: new Date().toISOString(),
    }).eq('id', run.id).then(() => {});
  });

  return Response.json({ success: true, runId: run.id, status: 'running' }, { status: 202 });
}

async function updateProgress(
  admin: ReturnType<typeof createAdminClient>,
  runId: string,
  progress: number,
  stage: string,
  extra?: Record<string, unknown>
) {
  await admin.from('discover_runs').update({
    progress,
    current_stage: stage,
    updated_at: new Date().toISOString(),
    ...extra,
  }).eq('id', runId);
}

async function runScan(
  runId: string,
  clientId: string,
  client: ClientProfile,
  admin: ReturnType<typeof createAdminClient>
): Promise<void> {
  const scanStart = Date.now();

  await updateProgress(admin, runId, 10, 'Starting 62-source parallel scan across India...');

  // ── PHASE 1: All 7 source modules run simultaneously ───────────────────────
  const [
    searchResult, newsResult, socialResult, financialResult,
    regulatoryResult, academicResult, videoResult,
  ] = await Promise.allSettled([
    fetchSearchSources(client),
    fetchNewsSources(client),
    fetchSocialSources(client),
    fetchFinancialSources(client),
    fetchRegulatorySources(client),
    fetchAcademicSources(client),
    fetchVideoSources(client),
  ]);

  await updateProgress(admin, runId, 55, 'Sources fetched. Running AI sentiment & frame analysis...');

  // ── Collect results ────────────────────────────────────────────────────────
  const moduleResults = [
    searchResult, newsResult, socialResult, financialResult,
    regulatoryResult, academicResult, videoResult,
  ];
  const moduleNames = ['search', 'news', 'social', 'financial', 'regulatory', 'academic', 'video'];

  const allResults: SourceResult[] = [];
  const moduleErrors: string[] = [];
  const moduleSummary: Record<string, { count: number; durationMs: number; errors: string[] }> = {};
  let totalSourcesScanned = 0;

  for (let i = 0; i < moduleResults.length; i++) {
    const result = moduleResults[i];
    const name = moduleNames[i];
    if (result.status === 'fulfilled') {
      allResults.push(...result.value.results);
      totalSourcesScanned += result.value.sourcesScanned;
      moduleSummary[name] = {
        count: result.value.results.length,
        durationMs: result.value.durationMs,
        errors: result.value.errors,
      };
      moduleErrors.push(...result.value.errors.map(e => `[${name}] ${e}`));
    } else {
      moduleSummary[name] = { count: 0, durationMs: 0, errors: [String(result.reason)] };
      moduleErrors.push(`[${name}] failed: ${result.reason?.message ?? 'unknown'}`);
    }
  }

  await updateProgress(admin, runId, 65, `${allResults.length} mentions found. Classifying sentiment & frames...`);

  // ── PHASE 2: AI Analysis ───────────────────────────────────────────────────
  const { enrichedResults, analysis, lsi } = await runFullAnalysis(allResults, client);

  await updateProgress(admin, runId, 85, 'AI analysis complete. Saving to database...');

  // ── Deduplicate ────────────────────────────────────────────────────────────
  const seen = new Set<string>();
  const dedupedResults = enrichedResults.filter(r => {
    const key = r.url || `${r.source}:${r.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const topMentions = dedupedResults
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, 200)
    .map(r => ({
      source: r.source,
      category: r.category,
      url: r.url,
      title: r.title,
      snippet: r.snippet.slice(0, 500),
      date: r.date ?? null,
      sentiment: r.sentiment ?? 0,
      frame: r.frame ?? 'other',
      relevance_score: r.relevanceScore ?? 0,
    }));

  // ── Save results ───────────────────────────────────────────────────────────
  const { error: updateError } = await admin
    .from('discover_runs')
    .update({
      status: 'completed',
      progress: 100,
      current_stage: 'Complete',
      completed_at: new Date().toISOString(),
      total_mentions: dedupedResults.length,
      sources_completed: totalSourcesScanned,
      sentiment_dist: analysis.sentiment,
      frame_dist: analysis.frames,
      top_keywords: analysis.topKeywords,
      mentions: topMentions,
      analysis_summary: analysis.summary,
      archetype_hints: analysis.archetypeHints,
      crisis_signals: analysis.crisisSignals,
      lsi_preliminary: lsi.total,
      module_summary: moduleSummary,
      scan_errors: moduleErrors.slice(0, 50),
      scan_duration_ms: Date.now() - scanStart,
    })
    .eq('id', runId);

  if (updateError) throw new Error(updateError.message);

  // Save LSI run
  await admin.from('lsi_runs').insert({
    client_id: clientId,
    discover_run_id: runId,
    run_date: new Date().toISOString(),
    total_score: lsi.total,
    components: lsi.components,
    stats: lsi.stats,
    gaps: lsi.gaps,
    inputs: {
      totalMentions: dedupedResults.length,
      sentimentDist: analysis.sentiment,
      frameDist: analysis.frames,
      sourcesScanned: totalSourcesScanned,
    },
  });

  // Set baseline_lsi on client if not set
  const supabase = await createClient();
  const { data: clientRecord } = await supabase
    .from('clients').select('baseline_lsi').eq('id', clientId).single();
  if (!clientRecord?.baseline_lsi) {
    await admin.from('clients').update({
      baseline_lsi: lsi.total,
      updated_at: new Date().toISOString(),
    }).eq('id', clientId);
  }

  console.log(`✅ Scan: ${client.name} | ${dedupedResults.length} mentions | LSI ${lsi.total} | ${Date.now() - scanStart}ms`);
}

// ── GET: Poll scan status ──────────────────────────────────────────────────
export async function GET(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');
  const clientId = searchParams.get('clientId');

  if (!runId && !clientId) return Response.json({ error: 'runId or clientId required' }, { status: 400 });

  let query = supabase.from('discover_runs').select(
    'id, status, progress, current_stage, total_mentions, sources_total, sources_completed, started_at, completed_at, sentiment_dist, frame_dist, top_keywords, analysis_summary, archetype_hints, crisis_signals, lsi_preliminary, module_summary, scan_errors, scan_duration_ms, error_message'
  );

  if (runId) {
    query = query.eq('id', runId);
  } else {
    query = query.eq('client_id', clientId!).order('created_at', { ascending: false }).limit(1);
  }

  const { data, error } = await query.single();
  if (error || !data) return Response.json({ error: 'Run not found' }, { status: 404 });

  if (data.status === 'completed' && searchParams.get('includeMentions') === 'true') {
    const { data: full } = await supabase
      .from('discover_runs').select('mentions').eq('id', data.id).single();
    return Response.json({ ...data, mentions: full?.mentions ?? [] });
  }

  return Response.json(data);
}
