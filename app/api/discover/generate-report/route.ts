/**
 * POST /api/discover/generate-report
 *
 * Multi-agent discovery report generation.
 * CRITICAL FIX: Passes actual scan results + full client profile to agents.
 * Agents are grounded in real data — never hallucinate.
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

    const sentiment = (run.sentiment_summary   as Record<string,number>) ?? {};
    const frames    = (run.frame_distribution  as Record<string,number>) ?? {};

    // ── FIX 1: Pull actual scan results from the run ─────────────────────────
    // The scan stores enriched results in the DB — pass them to agents
    const rawMentions = (run.enriched_results as Array<Record<string,unknown>>) ?? [];
    const topMentions = rawMentions
      .sort((a, b) => ((b.relevanceScore as number) ?? 0) - ((a.relevanceScore as number) ?? 0))
      .slice(0, 60) // top 60 most relevant — enough context, not overwhelming
      .map(r => ({
        source:    String(r.source   ?? ''),
        title:     String(r.title    ?? ''),
        snippet:   String(r.snippet  ?? '').slice(0, 400),
        url:       String(r.url      ?? ''),
        sentiment: (r.sentiment      as number) ?? 0,
        frame:     String(r.frame    ?? 'other'),
        category:  String(r.category ?? 'search'),
        date:      r.date ? String(r.date) : undefined,
      }));

    // ── FIX 2: Build complete client profile including bio + known works ──────
    const keywords    = (client.keywords    as string[]) ?? [];
    const socialLinks = (client.social_links as Record<string,string>) ?? {};
    const bio         = (client.bio         as string)  ?? '';

    // Extract known works from bio + keywords — these are explicitly stated by the user
    // We never let AI guess or hallucinate these
    const knownWorksFromProfile = extractKnownWorks(bio, keywords);

    const report = await generateDiscoveryReportAgentically({
      client: {
        name:              client.name,
        role:              client.role        ?? '',
        company:           client.company     ?? '',
        industry:          client.industry    ?? '',
        keywords,
        linkedin_url:      client.linkedin_url ?? undefined,
        bio,
        social_links:      socialLinks,
        known_works:       knownWorksFromProfile,
      },
      total_mentions:  run.total_mentions  ?? 0,
      top_mentions:    topMentions,  // ← THE FIX: actual scan data, not []
      sentiment:       { positive: sentiment.positive ?? 0, neutral: sentiment.neutral ?? 100, negative: sentiment.negative ?? 0 },
      frames:          { expert: frames.expert ?? 0, founder: frames.founder ?? 0, leader: frames.leader ?? 0, family: frames.family ?? 0, crisis: frames.crisis ?? 0, other: frames.other ?? 100 },
      top_keywords:    (run.top_keywords   as string[]) ?? [],
      crisis_signals:  (run.crisis_signals as string[]) ?? [],
      archetype_hints: (run.archetype_hints as string[]) ?? [],
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

/**
 * Extract explicitly stated works from bio text and keywords array.
 * These are ground-truth — never hallucinated.
 */
function extractKnownWorks(bio: string, keywords: string[]): string[] {
  const works: string[] = [];

  // From keywords — anything in quotes or that looks like a title
  for (const kw of keywords) {
    const trimmed = kw.trim();
    // Quoted title
    const quoted = trimmed.match(/["']([^"']+)["']/);
    if (quoted) { works.push(quoted[1]); continue; }
    // Looks like a title (title case, 2+ words, or a single proper noun)
    if (/^[A-Z]/.test(trimmed) && trimmed.length > 3) {
      works.push(trimmed);
    }
  }

  // From bio — extract items after "book:", "film:", "movie:", "wrote:", "directed:", "published:"
  const bioPatterns = [
    /(?:book|novel|authored?|wrote|published)[:\s]+["']?([A-Z][^"'\n,;.]{3,40})["']?/gi,
    /(?:film|movie|directed?|produced?)[:\s]+["']?([A-Z][^"'\n,;.]{3,40})["']?/gi,
    /["']([A-Z][^"']{3,40})["']/g,  // anything in quotes in bio
  ];

  for (const pattern of bioPatterns) {
    let match;
    while ((match = pattern.exec(bio)) !== null) {
      const title = match[1].trim();
      if (title.length > 3 && !works.includes(title)) {
        works.push(title);
      }
    }
  }

  return [...new Set(works)].slice(0, 20);
}
