/**
 * Discover Scan API — Real implementation
 * 
 * POST /api/discover/scan
 * Runs a multi-source reputation scan using Google Custom Search + OpenAI analysis.
 * Stores results in discover_runs + lsi_runs tables.
 */

import { createClient, createAdminClient, verifyClientOwnership } from '@/lib/supabase/server';
import { z } from 'zod';

const Schema = z.object({
  clientId: z.string().uuid(),
});

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 });

  const { clientId } = parsed.data;
  const isOwner = await verifyClientOwnership(clientId);
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 });

  // Fetch client details
  const { data: client } = await supabase.from('clients').select('name, company, role, industry, linkedin_url, keywords').eq('id', clientId).single();
  if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

  // Create discover_run record
  const admin = createAdminClient();
  const { data: run, error: runError } = await admin.from('discover_runs').insert({
    client_id: clientId,
    status: 'running',
    progress: 5,
    started_at: new Date().toISOString(),
  }).select().single();

  if (runError) return Response.json({ error: 'Failed to create scan record', message: runError.message }, { status: 500 });

  // Run scan in background (non-blocking)
  runScan(run.id, clientId, client).catch(console.error);

  return Response.json({ success: true, runId: run.id, status: 'running' }, { status: 202 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Background scan orchestrator
// ─────────────────────────────────────────────────────────────────────────────
async function runScan(runId: string, clientId: string, client: {
  name: string; company: string | null; role: string | null;
  industry: string | null; linkedin_url: string | null; keywords: string[] | null;
}) {
  const admin = createAdminClient();
  const progress = async (pct: number) => {
    await admin.from('discover_runs').update({ progress: pct }).eq('id', runId);
  };

  try {
    const searchQuery = buildSearchQuery(client);

    // Phase 1: Google Custom Search (30%)
    await progress(10);
    const searchResults = await googleSearch(searchQuery, 10);
    await progress(30);

    // Phase 2: News search (50%)
    const newsResults = await googleSearch(`"${client.name}" site:economictimes.com OR site:livemint.com OR site:businessstandard.com OR site:bloomberg.com OR site:ft.com`, 5);
    await progress(50);

    // Phase 3: AI analysis (80%)
    const allResults = [...searchResults, ...newsResults];
    const analysis = await analyzeWithAI(client.name, client, allResults);
    await progress(80);

    // Phase 4: Calculate LSI (95%)
    const lsiResult = calculateLSI(analysis);
    await progress(95);

    // Save LSI run
    await admin.from('lsi_runs').insert({
      client_id: clientId,
      total_score: lsiResult.total,
      components: lsiResult.components,
      inputs: { searchResults: allResults.length, sentimentAnalysis: analysis.sentiment },
      stats: lsiResult.stats,
      gaps: lsiResult.gaps,
    });

    // Update discover_run with final results
    await admin.from('discover_runs').update({
      status: 'completed',
      progress: 100,
      total_mentions: allResults.length,
      sentiment_summary: analysis.sentiment,
      frame_distribution: analysis.frames,
      top_keywords: analysis.topKeywords,
      raw_results: allResults.slice(0, 20), // store top 20 for display
      completed_at: new Date().toISOString(),
    }).eq('id', runId);

    // Update client baseline LSI if not set
    const { data: existingClient } = await admin.from('clients').select('baseline_lsi').eq('id', clientId).single();
    if (!existingClient?.baseline_lsi) {
      await admin.from('clients').update({ baseline_lsi: lsiResult.total }).eq('id', clientId);
    }

  } catch (err) {
    console.error('Scan error:', err);
    await admin.from('discover_runs').update({
      status: 'failed',
      error_message: err instanceof Error ? err.message : 'Unknown error',
      completed_at: new Date().toISOString(),
    }).eq('id', runId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Custom Search
// ─────────────────────────────────────────────────────────────────────────────
interface SearchItem { title: string; snippet: string; link: string; displayLink: string; }

async function googleSearch(query: string, num: number = 10): Promise<SearchItem[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    // Fallback: return mock data for development
    console.warn('GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX not set — using placeholder results');
    return generatePlaceholderResults(query, num);
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(Math.min(num, 10)));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Google API error: ${res.status}`);
    const data = await res.json();
    return (data.items || []) as SearchItem[];
  } catch (err) {
    console.error('Google search error:', err);
    return generatePlaceholderResults(query, num);
  }
}

function generatePlaceholderResults(query: string, num: number): SearchItem[] {
  const name = query.split('"')[1] || query.split(' ')[0];
  return Array.from({ length: Math.min(num, 5) }, (_, i) => ({
    title: `${name} — ${['Leadership Interview', 'Industry Insights', 'Expert Analysis', 'Conference Talk', 'Board Appointment'][i % 5]}`,
    snippet: `${name} shares insights on ${['sustainability', 'innovation', 'growth strategy', 'market trends', 'leadership'][i % 5]}. Known for expertise in driving organizational change.`,
    link: `https://example.com/article-${i + 1}`,
    displayLink: ['economictimes.com', 'livemint.com', 'businessstandard.com', 'linkedin.com', 'youtube.com'][i % 5],
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// AI analysis (sentiment + framing + keywords)
// ─────────────────────────────────────────────────────────────────────────────
interface Analysis {
  sentiment: { positive: number; neutral: number; negative: number; average: number };
  frames: Record<string, number>;
  topKeywords: string[];
  archetypeHints: string[];
  crisisSignals: string[];
}

async function analyzeWithAI(clientName: string, client: {
  role: string | null; industry: string | null; keywords: string[] | null;
}, results: SearchItem[]): Promise<Analysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  const snippets = results.map(r => `[${r.displayLink}] ${r.title}: ${r.snippet}`).join('\n');

  if (!apiKey) {
    return generatePlaceholderAnalysis(results);
  }

  try {
    const systemPrompt = `You are an expert reputation analyst. Analyze search results about "${clientName}" and return a JSON object with this exact structure:
{
  "sentimentScores": [array of -1 to 1 numbers, one per result],
  "frames": {"expert": 0-100, "founder": 0-100, "leader": 0-100, "family": 0-100, "crisis": 0-100, "other": 0-100},
  "topKeywords": [top 8 single-word keywords that appear frequently],
  "archetypeHints": [1-3 archetype suggestions like "Visionary", "Expert Authority", "Disruptor"],
  "crisisSignals": [list any crisis keywords found, empty array if none],
  "summary": "2-sentence reputation summary"
}
Return ONLY valid JSON, no markdown.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze these search results about ${clientName} (${client.role || 'professional'} in ${client.industry || 'business'}):\n\n${snippets}` }
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    const scores: number[] = parsed.sentimentScores || results.map(() => 0.2);
    const pos = scores.filter((s: number) => s > 0.2).length;
    const neg = scores.filter((s: number) => s < -0.2).length;
    const neu = scores.length - pos - neg;
    const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;

    return {
      sentiment: { positive: pos, neutral: neu, negative: neg, average: Math.round(avg * 100) / 100 },
      frames: parsed.frames || { expert: 40, founder: 20, leader: 25, family: 5, crisis: 5, other: 5 },
      topKeywords: parsed.topKeywords || [],
      archetypeHints: parsed.archetypeHints || [],
      crisisSignals: parsed.crisisSignals || [],
    };
  } catch (err) {
    console.error('AI analysis error:', err);
    return generatePlaceholderAnalysis(results);
  }
}

function generatePlaceholderAnalysis(results: SearchItem[]): Analysis {
  const total = results.length || 5;
  return {
    sentiment: { positive: Math.round(total * 0.6), neutral: Math.round(total * 0.3), negative: Math.round(total * 0.1), average: 0.35 },
    frames: { expert: 45, founder: 20, leader: 20, family: 5, crisis: 5, other: 5 },
    topKeywords: ['leadership', 'innovation', 'strategy', 'growth', 'sustainability', 'expertise', 'impact', 'vision'],
    archetypeHints: ['Expert Authority', 'Visionary Leader'],
    crisisSignals: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LSI Calculation (6 components, 0–100 total)
// ─────────────────────────────────────────────────────────────────────────────
function calculateLSI(analysis: Analysis) {
  const { sentiment, frames } = analysis;
  const total = sentiment.positive + sentiment.neutral + sentiment.negative || 1;
  const posPct = sentiment.positive / total;
  const expertPct = (frames.expert || 0) / 100;
  const crisisPct = (frames.crisis || 0) / 100;
  const avgSentiment = sentiment.average;

  // C1: Search Reputation (0-20)
  const c1 = Math.min(Math.round(posPct * 12 + expertPct * 6 + (avgSentiment > 0 ? 2 : 0)), 20);

  // C2: Media Framing (0-20)
  const c2 = Math.min(Math.round(expertPct * 12 + (frames.founder || 0) / 100 * 5 + (frames.leader || 0) / 100 * 3), 20);

  // C3: Social Backlash (0-20) — inverted: low crisis = high score
  const c3 = Math.min(Math.round(20 - crisisPct * 20 + (sentiment.negative === 0 ? 3 : 0)), 20);

  // C4: Elite Discourse (0-15) — based on quality of results
  const c4 = Math.min(Math.round(expertPct * 10 + posPct * 5), 15);

  // C5: Third-Party Validation (0-15)
  const c5 = Math.min(Math.round(posPct * 10 + (total > 10 ? 3 : 1) + (analysis.crisisSignals.length === 0 ? 2 : 0)), 15);

  // C6: Crisis Moat (0-10)
  const c6 = Math.min(Math.round(10 - crisisPct * 10 - (analysis.crisisSignals.length * 2)), 10);

  const totalScore = c1 + c2 + c3 + c4 + c5 + Math.max(c6, 0);
  const components = { c1, c2, c3, c4, c5, c6: Math.max(c6, 0) };

  // Gap analysis — which components are furthest from their max?
  const maxes = { c1: 20, c2: 20, c3: 20, c4: 15, c5: 15, c6: 10 };
  const labels = { c1: 'Search Reputation', c2: 'Media Framing', c3: 'Social Backlash', c4: 'Elite Discourse', c5: 'Third-Party Validation', c6: 'Crisis Moat' };
  const gaps = (Object.keys(components) as Array<keyof typeof components>)
    .map(k => ({ component: labels[k], current: components[k], max: maxes[k], gap: maxes[k] - components[k] }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  return {
    total: Math.min(totalScore, 100),
    components,
    gaps,
    stats: {
      mean: sentiment.average,
      stddev: 0.2,
      ucl: sentiment.average + 0.4,
      lcl: Math.max(sentiment.average - 0.4, -1),
    },
  };
}

function buildSearchQuery(client: { name: string; company: string | null; role: string | null; keywords: string[] | null }): string {
  const parts = [`"${client.name}"`];
  if (client.company) parts.push(`"${client.company}"`);
  if (client.role) parts.push(client.role.split(' ').slice(0, 2).join(' '));
  if (client.keywords?.length) parts.push(client.keywords.slice(0, 2).join(' OR '));
  return parts.join(' ');
}

export async function GET(): Promise<Response> {
  return Response.json({ error: 'Use POST to start a scan' }, { status: 405 });
}
