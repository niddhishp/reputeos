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
import { ClientProfile, SourceResult, AnalysisResult, LSIResult } from '../sources/types';
import { fetchSearchSources } from '../sources/search';
import { fetchNewsSources } from '../sources/news';
import { fetchSocialSources } from '../sources/social';
import { fetchFinancialSources } from '../sources/financial';
import { fetchRegulatorySources } from '../sources/regulatory';
import { fetchAcademicSources } from '../sources/academic';
import { fetchVideoSources } from '../sources/video';
import { runFullAnalysis, calculateLSI } from '../sources/ai-analysis';

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
    .select('name, company, role, industry, linkedin_url, keywords, social_links')
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
    social_links: clientData.social_links,
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

  // CRITICAL: Vercel terminates the function the moment a Response is returned.
  // Any background work (.catch fire-and-forget) is killed immediately.
  // We MUST await the full scan before returning — the 300s maxDuration in
  // vercel.json gives us plenty of time. The UI polls Supabase for progress,
  // so the user sees live updates regardless of when this HTTP call resolves.
  try {
    await runScan(run.id, clientId, client, admin);
  } catch (err) {
    console.error('Scan failed:', err);
    await admin.from('discover_runs').update({
      status: 'failed',
      error_message: String((err as Error)?.message ?? 'Unknown error'),
      completed_at: new Date().toISOString(),
    }).eq('id', run.id);
    return Response.json({ error: 'Scan failed', runId: run.id }, { status: 500 });
  }

  return Response.json({ success: true, runId: run.id, status: 'completed' }, { status: 200 });
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

// Fallback analysis when AI times out — pure heuristics, no API calls
function runFallbackAnalysis(
  results: SourceResult[],
  client: ClientProfile
): { analysis: AnalysisResult; lsi: LSIResult } {
  const positiveWords = ['award', 'launch', 'growth', 'innovative', 'leader', 'success', 'best', 'top', 'leading', 'pioneer', 'expert'];
  const negativeWords = ['lawsuit', 'fraud', 'scandal', 'controversy', 'resign', 'fired', 'probe', 'crisis', 'fail', 'ban'];

  let pos = 0, neg = 0;
  const frames: Record<string, number> = { expert: 0, founder: 0, leader: 0, family: 0, crisis: 0, other: 0 };

  for (const r of results) {
    const text = (r.title + ' ' + r.snippet).toLowerCase();
    const posCount = positiveWords.filter(w => text.includes(w)).length;
    const negCount = negativeWords.filter(w => text.includes(w)).length;
    const sentiment = (posCount - negCount) / Math.max(posCount + negCount, 1);
    r.sentiment = sentiment;

    if (negCount > 0) { r.frame = 'crisis'; frames.crisis++; }
    else if (text.includes('found') || text.includes('startup') || text.includes('build')) { r.frame = 'founder'; frames.founder++; }
    else if (text.includes('expert') || text.includes('research') || text.includes('study')) { r.frame = 'expert'; frames.expert++; }
    else if (text.includes('lead') || text.includes('direct') || text.includes('chief')) { r.frame = 'leader'; frames.leader++; }
    else { r.frame = 'other'; frames.other++; }

    if (sentiment > 0.2) pos++;
    else if (sentiment < -0.2) neg++;
  }

  const total = Math.max(results.length, 1);
  const avgSentiment = results.reduce((s, r) => s + (r.sentiment ?? 0), 0) / total;
  const totalFrames = Math.max(Object.values(frames).reduce((a, b) => a + b, 0), 1);

  const keywords = [...new Set(
    results.flatMap(r => (r.title + ' ' + r.snippet).toLowerCase()
      .split(/\W+/).filter(w => w.length > 4 && !['about', 'their', 'which', 'there', 'these'].includes(w))
    )
  )].slice(0, 10);

  const analysis: AnalysisResult = {
    sentiment: {
      positive: Math.round((pos / total) * 100),
      neutral: Math.round(((total - pos - neg) / total) * 100),
      negative: Math.round((neg / total) * 100),
      average: Math.round(avgSentiment * 100) / 100,
    },
    frames: {
      expert:  Math.round((frames.expert  / totalFrames) * 100),
      founder: Math.round((frames.founder / totalFrames) * 100),
      leader:  Math.round((frames.leader  / totalFrames) * 100),
      family:  Math.round((frames.family  / totalFrames) * 100),
      crisis:  Math.round((frames.crisis  / totalFrames) * 100),
      other:   Math.round((frames.other   / totalFrames) * 100),
    },
    topKeywords: keywords,
    archetypeHints: [],
    crisisSignals: results.filter(r => r.frame === 'crisis').slice(0, 3).map(r => r.title),
    summary: `Discovery scan complete for ${client.name}. Found ${results.length} mentions across ${new Set(results.map(r => r.source)).size} sources. Sentiment: ${Math.round((pos/total)*100)}% positive. (AI analysis skipped — results saved for manual review.)`,
  };

  const lsi = calculateLSI(results, client);
  return { analysis, lsi };
}

async function runScan(
  runId: string,
  clientId: string,
  client: ClientProfile,
  admin: ReturnType<typeof createAdminClient>
): Promise<void> {
  const scanStart = Date.now();

  await updateProgress(admin, runId, 10, 'Starting 62-source parallel scan across India...');

  // ── PHASE 1: All 7 modules in parallel with live progress ticks ────────────
  // Wraps each module so the bar moves as each one finishes (12–50%)
  // instead of jumping from 10% to 55% in one go.
  let completedModules = 0;
  const MODULE_COUNT = 7;

  function wrapModule<T>(promise: Promise<T>, label: string): Promise<T> {
    return promise.then(result => {
      completedModules++;
      const pct = 12 + Math.round((completedModules / MODULE_COUNT) * 38);
      updateProgress(admin, runId, pct, `${label} done (${completedModules}/${MODULE_COUNT})...`).catch(() => {});
      return result;
    });
  }

  const [
    searchResult, newsResult, socialResult, financialResult,
    regulatoryResult, academicResult, videoResult,
  ] = await Promise.allSettled([
    wrapModule(fetchSearchSources(client),     'Search & AI'),
    wrapModule(fetchNewsSources(client),       'News & Media'),
    wrapModule(fetchSocialSources(client),     'Social Media'),
    wrapModule(fetchFinancialSources(client),  'Financial'),
    wrapModule(fetchRegulatorySources(client), 'Regulatory'),
    wrapModule(fetchAcademicSources(client),   'Academic'),
    wrapModule(fetchVideoSources(client),      'Video & Podcasts'),
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

  await updateProgress(admin, runId, 65, `${allResults.length} mentions found. Running AI analysis...`);

  // ── PHASE 2: AI Analysis with hard timeout ─────────────────────────────────
  // Cap results at 50 before AI to prevent 10+ sequential OpenRouter calls
  // which can exceed Vercel's 300s function limit.
  // Wrap entire AI phase in a 90s timeout — if it hangs, complete scan anyway.
  const resultsForAI = allResults
    .sort((a, b) => (b.relevanceScore ?? 0.5) - (a.relevanceScore ?? 0.5))
    .slice(0, 50);

  let aiPct = 65;
  const aiHeartbeat = setInterval(() => {
    if (aiPct < 82) {
      aiPct += 3;
      updateProgress(admin, runId, aiPct, `AI analysing ${resultsForAI.length} top mentions...`).catch(() => {});
    }
  }, 4000);

  let enrichedResults: SourceResult[], analysis: AnalysisResult, lsi: LSIResult;
  try {
    const aiTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI analysis timeout')), 90_000)
    );
    ({ enrichedResults, analysis, lsi } = await Promise.race([
      runFullAnalysis(resultsForAI, client),
      aiTimeout,
    ]));
  } catch (aiErr) {
    // AI timed out or failed — complete scan with raw results + basic stats
    console.warn('[ReputeOS] AI analysis skipped:', (aiErr as Error).message);
    clearInterval(aiHeartbeat);
    const fallbackLsi = runFallbackAnalysis(allResults, client);
    enrichedResults = allResults;
    analysis = fallbackLsi.analysis;
    lsi = fallbackLsi.lsi;
  } finally {
    clearInterval(aiHeartbeat);
  }

  await updateProgress(admin, runId, 85, 'AI analysis complete. Deduplicating results...');

  // ── Deduplicate ────────────────────────────────────────────────────────────
  const seen = new Set<string>();
  const dedupedResults = enrichedResults.filter(r => {
    const key = r.url || `${r.source}:${r.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── PHASE 3: Discovery report generated separately via /api/discover/report ─
  // The report is NOT generated here — it runs in its own Vercel function (120s budget)
  // The discover page automatically triggers it after scan completes.
  const discoveryReport = null;

  await updateProgress(admin, runId, 92, 'Saving results...');

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
      sentiment_summary: analysis.sentiment,
      frame_distribution: analysis.frames,
      top_keywords: analysis.topKeywords,
      analysis_summary: analysis.summary,
      archetype_hints: analysis.archetypeHints,
      crisis_signals: analysis.crisisSignals,
      lsi_preliminary: lsi.total,
      module_summary: moduleSummary,
      scan_errors: moduleErrors.slice(0, 50),
      scan_duration_ms: Date.now() - scanStart,
      discovery_report: discoveryReport,
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
    'id, status, progress, current_stage, total_mentions, sources_total, sources_completed, started_at, completed_at, sentiment_summary, frame_distribution, analysis_summary, archetype_hints, crisis_signals, lsi_preliminary, module_summary, scan_errors, scan_duration_ms, error_message, discovery_report'
  );

  if (runId) {
    query = query.eq('id', runId);
  } else {
    query = query.eq('client_id', clientId!).order('created_at', { ascending: false }).limit(1);
  }

  const { data, error } = await query.single();
  if (error || !data) return Response.json({ error: 'Run not found' }, { status: 404 });

  if (data.status === 'completed' && searchParams.get('includeMentions') === 'true') {
    // mentions stored in separate table — return empty for now
    return Response.json({ ...data, mentions: [] });
  }

  return Response.json(data);
}
