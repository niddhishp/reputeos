/**
 * POST /api/discover/generate-report
 * Splits report generation into 2 parallel AI calls (5 sections each)
 * so neither call hits token/time limits.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callAI, parseAIJson } from '@/lib/ai/call';
import type { DiscoveryReport, DiscoveryReportInput } from '../sources/discovery-report-prompt';
import { buildDiscoveryReportPrompts } from '../sources/discovery-report-prompt';

export const maxDuration = 300; // Vercel Pro max

const adminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

// ── Prompt builders for each half ────────────────────────────────────────────

function buildPart1Prompt(input: DiscoveryReportInput): { systemPrompt: string; userPrompt: string } {
  const { client, total_mentions, sentiment, frames, top_keywords, crisis_signals, lsi_preliminary } = input;
  const dominantFrame = Object.entries(frames).filter(([k]) => k !== 'other').sort(([,a],[,b]) => b - a)[0]?.[0] ?? 'other';
  const isNarrativeAbsent = sentiment.neutral > 70 || frames.other > 70;

  const systemPrompt = `You are a Principal Reputation Strategist at a top-tier PR firm. Produce SRE Discovery Reports for CEOs and executives.

RULES:
1. USE YOUR OWN KNOWLEDGE FIRST about ${client.name}, ${client.company}, their industry, and peers.
2. ${isNarrativeAbsent ? `HIGH NEUTRAL (${sentiment.neutral}%) + HIGH OTHER FRAME (${frames.other}%) = NARRATIVE ABSENCE RISK. This IS the core finding.` : 'Be specific and diagnostic.'}
3. Name real publications, real peers, real search queries. Never be generic.
4. Diagnose, don't just describe. Answer: "So what does this mean reputationally?"

Respond with ONLY valid JSON. No markdown, no explanation.`;

  const userPrompt = `Client: ${client.name} | ${client.role} at ${client.company} | ${client.industry}
Keywords: ${client.keywords.join(', ')}${client.linkedin_url ? ` | LinkedIn: ${client.linkedin_url}` : ''}

Scan: ${total_mentions} mentions | LSI: ${lsi_preliminary}/100 | Sentiment: ${sentiment.positive}% pos / ${sentiment.neutral}% neutral / ${sentiment.negative}% neg
Dominant frame: ${dominantFrame} | Top keywords: ${top_keywords.slice(0, 8).join(', ')}
Crisis signals: ${crisis_signals.length ? crisis_signals.join('; ') : 'None'}

Generate PART 1 of the report — these 5 sections as a single JSON object:

{
  "profile_overview": {
    "identity_headline": "one powerful phrase",
    "current_position": "exact role",
    "currently_known_for": "primary association today",
    "primary_role": "executive/founder/investor/etc",
    "primary_context": "business/family/civic/etc",
    "age_generation": "e.g. early 50s, Gen X",
    "location": "city, country",
    "digital_presence_score": 0,
    "digital_presence_narrative": "2 sentences on score"
  },
  "professional_background": {
    "summary": "2-3 sentence career overview",
    "trajectory": [{"year":"YYYY","milestone":"what happened","significance":"why it matters"}],
    "key_achievements": ["achievement 1","achievement 2","achievement 3"],
    "education": "degrees and institutions",
    "awards_recognition": ["award 1","award 2"]
  },
  "recent_developments": {
    "major_recent_event": "most significant recent news",
    "strategic_context": "reputational significance",
    "news_items": [{"headline":"headline","source":"publication","significance":"impact"}]
  },
  "search_reputation": {
    "keyword_association_map": [{"keyword_cluster":"e.g. Finance/Banking","percentage":45,"dominant_signal":"what this signals","strategic_implication":"SRE meaning"}],
    "identity_type": "Business-Led|Family-Led|Achievement-Led|Mixed|Narrative-Absent",
    "identity_diagnosis": "2 sentences diagnosing the situation",
    "search_split_narrative": "paragraph on what someone finds when they Google this person",
    "query_analysis": [{"query":"exact Google query","dominant_signal":"what comes up","insight":"strategic implication"}]
  },
  "media_framing": {
    "primary_frame": "how media primarily frames them",
    "how_described_in_domain_media": "paragraph on domain media coverage",
    "frame_distribution": {"expert_thought_leader":0,"business_operator":0,"family_figure":0,"personal_lifestyle":0,"governance":0},
    "sector_split": {"sector_context":0,"non_sector_context":0},
    "media_language": {"frequent_descriptors":["word1","word2"],"rare_descriptors":["missing1","missing2"]},
    "framing_narrative": "paragraph on media framing patterns",
    "strategic_framing_insight": "key strategic insight about their framing"
  }
}`;

  return { systemPrompt, userPrompt };
}

function buildPart2Prompt(input: DiscoveryReportInput): { systemPrompt: string; userPrompt: string } {
  const { client, sentiment, frames, crisis_signals } = input;
  const isNarrativeAbsent = sentiment.neutral > 70 || frames.other > 70;

  const systemPrompt = `You are a Principal Reputation Strategist. Complete the second half of an SRE Discovery Report.

RULES:
1. USE YOUR OWN KNOWLEDGE about ${client.name}, ${client.company}, their peers, and industry.
2. ${isNarrativeAbsent ? 'This person has Narrative Absence Risk — diagnose it sharply in the risk and diagnosis sections.' : 'Be specific, diagnostic, and name real people/publications.'}
3. For peers: name REAL executives at peer companies. Give actual follower estimates.
4. Be the most insightful report the client has ever read about themselves.

Respond with ONLY valid JSON. No markdown, no explanation.`;

  const userPrompt = `Client: ${client.name} | ${client.role} at ${client.company} | ${client.industry}
Crisis signals: ${crisis_signals.length ? crisis_signals.join('; ') : 'None'}

Generate PART 2 of the report — these 5 sections as a single JSON object:

{
  "social_and_thought_leadership": {
    "overview_narrative": "paragraph on overall social/content presence",
    "visibility_tier": "High|Medium-High|Medium|Low|Minimal",
    "linkedin": {"followers":"estimate e.g. 8,000","activity":"Active|Dormant|Absent","positioning":"how they present"},
    "twitter_x": {"followers":"estimate","activity":"Active|Dormant|Absent","positioning":"their X presence"},
    "wikipedia": {"exists":false,"quality":"None|Stub|Basic|Comprehensive"},
    "conference_participation": ["conference 1","conference 2"],
    "speaking_engagements": ["event 1"],
    "op_eds": ["publication 1"],
    "ai_discoverability": "High|Medium|Low|Minimal",
    "ai_discoverability_narrative": "how AI tools describe this person",
    "thought_leadership_gap": "specific gap"
  },
  "peer_comparison": {
    "peers": [
      {"name":"Real Peer Name","role":"their role","visibility_level":"High|Medium|Low","primary_frame":"how known","followers_approx":"50K","competitive_gap":"specific gap vs client"}
    ],
    "competitive_positioning_narrative": "paragraph comparing to peers",
    "relative_visibility": "High|Medium-High|Medium|Medium-Low|Low vs peers"
  },
  "key_questions": {
    "identity_architecture": "Is ${client.name} known as X or Y? Be specific.",
    "search_results_breakdown": "Top 10 Google results — what % in what context?",
    "expert_citation_vs_mention": "Cited as expert or just mentioned?",
    "thought_leadership_presence": "Any op-eds, papers, frameworks attributed to them?",
    "competitive_position": "Visibility vs named peers?",
    "crisis_association": "Any negative content or controversies?",
    "global_positioning": "Recognized internationally or India-only?"
  },
  "risk_assessment": {
    "layers": [
      {"authority_layer":"e.g. Professional Identity","observable_signal":"what we observe","gap_severity":"High|Moderate-High|Moderate|Low","narrative":"1-2 sentences on the risk"}
    ],
    "overall_risk_level": "High|Moderate-High|Moderate|Low",
    "primary_risk_type": "Narrative Absence Risk|Identity Confusion|Authority Vacuum|Visibility Deficit|Crisis Proximity|Frame Drift"
  },
  "reputation_diagnosis": {
    "headline": "one powerful diagnostic sentence — the single most important finding",
    "primary_risk_type": "Narrative Absence Risk|Identity Confusion|Authority Vacuum|Visibility Deficit|Crisis Proximity|Frame Drift",
    "narrative": "3-4 sentences synthesising the full picture",
    "strengths": [{"title":"strength","description":"2 sentences with evidence"}],
    "vulnerabilities": [{"title":"vulnerability","description":"2 sentences on risk"}],
    "opportunity_signal": "the single biggest SRE opportunity",
    "sre_opportunity_rating": "Exceptional|High|Medium|Low"
  }
}`;

  return { systemPrompt, userPrompt };
}

// ── Route handler ─────────────────────────────────────────────────────────────

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

    const input: DiscoveryReportInput = {
      client: {
        name:         client.name,
        role:         client.role        ?? '',
        company:      client.company     ?? '',
        industry:     client.industry    ?? '',
        keywords:     (client.keywords   as string[]) ?? [],
        linkedin_url: client.linkedin_url ?? undefined,
      },
      total_mentions:  run.total_mentions ?? 0,
      top_mentions:    [],
      sentiment:       { positive: sentiment.positive ?? 0, neutral: sentiment.neutral ?? 100, negative: sentiment.negative ?? 0 },
      frames:          { expert: frames.expert ?? 0, founder: frames.founder ?? 0, leader: frames.leader ?? 0, family: frames.family ?? 0, crisis: frames.crisis ?? 0, other: frames.other ?? 100 },
      top_keywords:    (run.top_keywords  as string[]) ?? [],
      crisis_signals:  (run.crisis_signals as string[]) ?? [],
      archetype_hints: [],
      lsi_preliminary: run.lsi_preliminary ?? 0,
    };

    console.log('[generate-report] Starting 2 parallel AI calls for', client.name);

    // Run both halves in parallel — each ~4000 tokens out, much faster than 8000 serial
    const [part1Result, part2Result] = await Promise.all([
      callAI({
        ...buildPart1Prompt(input),
        json: true,
        maxTokens: 4000,
        temperature: 0.3,
        timeoutMs: 120_000,
        model: 'smart',
      }),
      callAI({
        ...buildPart2Prompt(input),
        json: true,
        maxTokens: 4000,
        temperature: 0.3,
        timeoutMs: 120_000,
        model: 'smart',
      }),
    ]);

    console.log('[generate-report] Part1 length:', part1Result.content.length, '| Part2 length:', part2Result.content.length);

    const part1 = parseAIJson<Partial<DiscoveryReport>>(part1Result.content);
    const part2 = parseAIJson<Partial<DiscoveryReport>>(part2Result.content);

    const report: DiscoveryReport = {
      ...part1,
      ...part2,
      generated_at: new Date().toISOString(),
    } as DiscoveryReport;

    await admin.from('discover_runs').update({ discovery_report: report }).eq('id', runId);
    console.log('[generate-report] Report saved for run', runId);

    return NextResponse.json({ report, cached: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[generate-report] FAILED:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
