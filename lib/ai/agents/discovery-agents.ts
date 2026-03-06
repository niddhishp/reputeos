/**
 * Discovery Module — 6 Parallel Agents + Verification + Synthesis
 *
 * ARCHITECTURE:
 * 1. compileEvidence()       — pre-agent: structures raw scan data
 * 2. buildDiscoveryAgents()  — 6 parallel specialist agents
 * 3. verifyAgentOutputs()    — post-agent: flags unsupported claims
 * 4. runDiscoverySynthesis() — final diagnosis
 *
 * ACCURACY CONTRACT:
 * - Agents distinguish "scan did not detect X" from "X does not exist"
 * - Known works/bio are ground truth — never overridden
 * - Specific facts (titles, names, counts) only from evidence
 * - Absence is a finding, not a gap to fill with invention
 */

import { runAgents, runSynthesisAgent, buildClientContext, type Agent } from '../agents';
import type { DiscoveryReport, DiscoveryReportInput } from '@/app/api/discover/sources/discovery-report-prompt';

interface CompiledEvidenceGraph {
  total_results: number;
  unique_domains: number;
  domain_distribution: Record<string, number>;
  source_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  top_keywords: [string, number][];
}


/* ─────────────────────────────────────────────────────────────────────────────
   STEP 1: PRE-AGENT EVIDENCE COMPILER
   Structures raw scan data before agents receive it — gives synthesis agent
   metadata it can reason about (domain distribution, category counts, etc.)
───────────────────────────────────────────────────────────────────────────── */

function compileEvidence(input: DiscoveryReportInput): CompiledEvidenceGraph {
  const mentions = input.top_mentions ?? [];

  const domains: Record<string, number> = {};
  const sources: Record<string, number> = {};
  const categories: Record<string, number> = {};
  const keywords: Record<string, number> = {};

  for (const m of mentions) {
    let domain = 'unknown';
    try { if (m.url) domain = new URL(m.url).hostname.replace('www.', ''); } catch { /* ignore */ }

    domains[domain] = (domains[domain] ?? 0) + 1;
    sources[m.source ?? 'unknown'] = (sources[m.source ?? 'unknown'] ?? 0) + 1;
    categories[m.category ?? 'search'] = (categories[m.category ?? 'search'] ?? 0) + 1;

    const text = `${m.title ?? ''} ${m.snippet ?? ''}`.toLowerCase();
    text.split(/\s+/).forEach(t => {
      if (t.length > 4) keywords[t] = (keywords[t] ?? 0) + 1;
    });
  }

  return {
    total_results: mentions.length,
    unique_domains: Object.keys(domains).length,
    domain_distribution: domains,
    source_distribution: sources,
    category_distribution: categories,
    top_keywords: Object.entries(keywords).sort((a, b) => b[1] - a[1]).slice(0, 15),
  };
}


/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS: Format evidence for agent context
───────────────────────────────────────────────────────────────────────────── */

function formatScanResults(topMentions: DiscoveryReportInput['top_mentions'], max = 30): string {
  if (!topMentions?.length) return '\nSCAN RESULTS: No results retrieved.';

  const byCategory: Record<string, typeof topMentions> = {};
  for (const m of topMentions) {
    const cat = m.category ?? 'search';
    (byCategory[cat] ??= []).push(m);
  }

  const lines: string[] = ['\nACTUAL SCAN RESULTS (primary evidence — use these first):'];
  let count = 0;
  for (const [cat, items] of Object.entries(byCategory)) {
    lines.push(`\n[${cat.toUpperCase()}]`);
    for (const m of items.slice(0, Math.ceil(max / Object.keys(byCategory).length))) {
      if (count++ >= max) break;
      lines.push(`• ${m.source}: "${m.title}" — ${m.snippet?.slice(0, 200) ?? ''}${m.url ? `\n  URL: ${m.url}` : ''}`);
    }
  }
  return lines.join('\n');
}

function formatKnownWorks(client: DiscoveryReportInput['client']): string {
  const works = (client as Record<string, unknown>).known_works as string[] | undefined;
  const bio   = (client as Record<string, unknown>).bio as string | undefined;
  const links = (client as Record<string, unknown>).social_links as Record<string,string> | undefined;

  const parts: string[] = [];
  if (works?.length) {
    parts.push('\nCLIENT KNOWN WORKS (100% verified — reference exactly as written):');
    works.forEach(w => parts.push(`  • ${w}`));
  }
  if (bio?.length && bio.length > 10) {
    parts.push(`\nCLIENT BIO (self-described, treat as verified):\n${bio}`);
  }
  if (links && Object.keys(links).length) {
    parts.push('\nVERIFIED SOCIAL PROFILES (confirmed to exist):');
    Object.entries(links).forEach(([k, v]) => { if (v) parts.push(`  • ${k}: ${v}`); });
  }
  return parts.join('\n');
}


/* ─────────────────────────────────────────────────────────────────────────────
   STEP 2: 6 PARALLEL SPECIALIST AGENTS
───────────────────────────────────────────────────────────────────────────── */

const SYS = (name: string, company: string) =>
`You are a Principal Reputation Strategist writing one section of a Strategic Reputation Evaluation for ${name} (${company}).

GROUNDING RULES — NON-NEGOTIABLE:
1. SCAN DATA IS PRIMARY EVIDENCE. Every specific claim must be supported by scan results or the client profile.
2. KNOWN WORKS ARE 100% VERIFIED. Reference films, books, articles exactly as listed. Never alter titles.
3. TWO TYPES OF ABSENCE — always distinguish:
   (a) SCAN MISS: "Our scan did not detect coverage for X" — use when you know something likely exists but wasn't found
   (b) REAL GAP: "No coverage exists for X" — only when you are confident from your knowledge that it genuinely doesn't exist
4. For films with named cast, press LIKELY EXISTS even if scan didn't find it. Say so.
5. NEVER invent: titles, publication names, dates, follower counts, award names, event names.
6. For age/generation: always estimate from career timeline. Never say "not determinable."
7. For social followers: estimate from career stage. Never say "not detected" with no estimate.
8. Return ONLY valid JSON. No markdown, no preamble.`;

export function buildDiscoveryAgents(input: DiscoveryReportInput, compiled: CompiledEvidenceGraph): Agent[] {
  const { client, total_mentions, sentiment, frames, top_keywords, crisis_signals, lsi_preliminary, top_mentions } = input;

  const ctx       = buildClientContext(client);
  const knownData = formatKnownWorks(client);
  const scanData  = formatScanResults(top_mentions, 30);
  const isAbsent  = sentiment.neutral > 70 || frames.other > 70;

  const scanSummary = `\nSCAN SUMMARY: ${total_mentions} mentions | LSI ${lsi_preliminary}/100 | Sentiment ${sentiment.positive}%+ / ${sentiment.neutral}% neutral | Keywords: ${top_keywords.slice(0, 8).join(', ')}${isAbsent ? `\n⚠ HIGH NEUTRAL + OTHER FRAME: Likely indicates scan missed real content OR genuine thin footprint. Diagnose which.` : ''}`;

  const evidenceSummary = `\nEVIDENCE GRAPH: ${compiled.total_results} results | ${compiled.unique_domains} unique domains | Categories: ${JSON.stringify(compiled.category_distribution)}`;

  const fullCtx = ctx + knownData + scanData + scanSummary + evidenceSummary;
  const sys = SYS(client.name, client.company ?? '');

  return [

    /* ── AGENT 1: Profile Identity ─────────────────────── */
    {
      id: 'profile_overview',
      label: 'Profile Intelligence Agent',
      maxTokens: 1200,
      fallback: {
        profile_overview: {
          identity_headline: `${client.role ?? 'Professional'} at ${client.company ?? 'Unknown'}`,
          current_position: `${client.role} at ${client.company}`,
          currently_known_for: 'Analysis pending — rescan to generate.',
          primary_role: 'professional',
          primary_context: client.industry ?? 'business',
          age_generation: 'Not estimated — rescan required',
          location: 'India',
          digital_presence_score: 0,
          digital_presence_narrative: 'Report generation encountered an issue. Please rescan.',
          scan_confidence: 'Low' as const,
          scan_confidence_note: 'Agent failed — no confidence assessment available.',
        },
      },
      systemPrompt: `${sys}\nYour job: Identify this person's core professional identity based on verified evidence.`,
      userPrompt: `${fullCtx}

CRITICAL INSTRUCTIONS:
1. currently_known_for: Use your knowledge FIRST for well-known people. For others, use bio + known_works. If scan is sparse but they have verified films/books, lead with those.
2. age_generation: REQUIRED — estimate from career timeline. If directing Bollywood films with major stars, writing books, running a company = likely mid-30s to mid-40s. Never say "not determinable."
3. scan_confidence: Rate "High" if scan found their main credentials, "Medium" if partial, "Low" if scan clearly missed major known works.
4. digital_presence_score: Score 0-100 based on what was ACTUALLY found in scan + what you know exists.

Return JSON:
{"profile_overview":{"identity_headline":"one precise phrase based on their actual role and works","current_position":"exact current role from profile","currently_known_for":"what they are known for — use bio + known works + your knowledge","primary_role":"filmmaker|executive|author|etc","primary_context":"creative|business|academic|etc","age_generation":"REQUIRED estimate e.g. 'Mid-30s, Millennial' from career evidence","location":"city, country if available in profile","digital_presence_score":0,"digital_presence_narrative":"2 sentences: what scan found + what it likely missed","scan_confidence":"High|Medium|Low","scan_confidence_note":"one sentence: what the scan likely missed and why"}}`,
    },

    /* ── AGENT 2: Career & Works ───────────────────────── */
    {
      id: 'professional_background',
      label: 'Career Intelligence Agent',
      maxTokens: 2000,
      fallback: {
        professional_background: { summary: 'Career analysis pending.', trajectory: [], key_achievements: [], education: '', awards_recognition: [] },
        recent_developments: { major_recent_event: 'No recent events detected.', strategic_context: 'Rescan to refresh.', news_items: [] },
      },
      systemPrompt: `${sys}\nYour job: Build a verified career profile. Known works in the profile are 100% real — reference them precisely.`,
      userPrompt: `${fullCtx}

CRITICAL: Known works listed in the profile ARE verified. Reference films, books exactly as written.
For achievements: use scan evidence + your knowledge. Flag what's from scan vs knowledge.
For news_items: only include items you can tie to a real source URL or publication name from the scan.

Return JSON:
{"professional_background":{"summary":"2-3 sentence overview using verified facts from profile + scan","trajectory":[{"year":"YYYY","milestone":"specific event","significance":"why it matters reputationally"}],"key_achievements":["specific achievement with source"],"education":"if found in scan or profile","awards_recognition":["specific award if found in scan — else empty array"]},"recent_developments":{"major_recent_event":"from scan results — cite source. If nothing found, say so honestly.","strategic_context":"reputational significance","news_items":[{"headline":"from scan only","source":"actual publication name","significance":"impact"}]}}`,
    },

    /* ── AGENT 3: Search Reputation ────────────────────── */
    {
      id: 'search_reputation',
      label: 'Search Reputation Agent',
      maxTokens: 2000,
      fallback: {
        search_reputation: { keyword_association_map: [], identity_type: 'Narrative-Absent', identity_diagnosis: 'Search analysis pending.', search_split_narrative: 'Rescan to generate.', query_analysis: [] },
      },
      systemPrompt: `${sys}\nYour job: Analyse the ACTUAL search landscape. Distinguish scan misses from real absences.`,
      userPrompt: `${fullCtx}

TWO-TYPE ABSENCE RULE:
• SCAN MISS — say "Our scan did not detect coverage for [X]. Given [reason], coverage likely exists."
• REAL GAP — say "No coverage detected and none expected given their profile stage."

For a filmmaker with named cast (Arshad Warsi, Shweta Tripathi): press LIKELY EXISTS even if scan missed it.
For Wikipedia, major bylines, Forbes India: absence may be genuine — diagnose it as a real gap.

Return JSON:
{"search_reputation":{"keyword_association_map":[{"keyword_cluster":"based on actual scan categories","percentage":0,"dominant_signal":"what scan results show","strategic_implication":"what this means"}],"identity_type":"Business-Led|Family-Led|Achievement-Led|Mixed|Narrative-Absent","identity_diagnosis":"2 sentences on what scan results show they're known as","search_split_narrative":"paragraph: what someone finds when they Google this person, based on scan data + your knowledge","query_analysis":[{"query":"actual query","dominant_signal":"what scan returned","insight":"strategic implication"}]}}`,
    },

    /* ── AGENT 4: Media Framing ────────────────────────── */
    {
      id: 'media_framing',
      label: 'Media Framing Agent',
      maxTokens: 2000,
      fallback: {
        media_framing: {
          primary_frame: 'Analysis pending',
          how_described_in_domain_media: 'Media framing analysis unavailable. Please rescan.',
          frame_distribution: { expert_thought_leader: 0, business_operator: 0, family_figure: 0, personal_lifestyle: 0, governance: 0 },
          sector_split: { sector_context: 0, non_sector_context: 100 },
          media_language: { frequent_descriptors: [], rare_descriptors: [] },
          framing_narrative: 'Analysis pending.',
          strategic_framing_insight: 'Rescan to generate.',
        },
      },
      systemPrompt: `${sys}\nYour job: Analyse media framing patterns. Distinguish scan misses from genuine media absence.`,
      userPrompt: `${fullCtx}

Look at NEWS and SEARCH scan results for publication coverage.
CRITICAL DISTINCTION:
• If scan found no coverage for a film with recognisable cast → "Scan did not detect coverage — given the cast, trade press coverage likely exists but was not surfaced by our search."
• If you know from your training a specific publication covered this person → note it as "detected via AI knowledge, not scan."
• If coverage genuinely seems to not exist (no Wikipedia, no trade bylines ever) → diagnose as real gap.

NEVER say "zero coverage" when the person has verified films/books and you suspect coverage exists.

frame_distribution MUST sum to approximately 100. Estimate based on scan evidence.

Return JSON:
{"media_framing":{"primary_frame":"based on actual scan results","how_described_in_domain_media":"paragraph: what scan found + what likely exists but wasn't surfaced","frame_distribution":{"expert_thought_leader":0,"business_operator":0,"family_figure":0,"personal_lifestyle":0,"governance":0},"sector_split":{"sector_context":0,"non_sector_context":0},"media_language":{"frequent_descriptors":["words from scan titles/snippets"],"rare_descriptors":["words absent given their role"]},"framing_narrative":"paragraph on media framing from scan data + knowledge","strategic_framing_insight":"most important observation about their media presence or absence"}}`,
    },

    /* ── AGENT 5: Social & Thought Leadership ──────────── */
    {
      id: 'social_and_thought_leadership',
      label: 'Thought Leadership Agent',
      maxTokens: 2000,
      fallback: {
        social_and_thought_leadership: {
          overview_narrative: 'Social analysis pending.',
          visibility_tier: 'Low',
          linkedin: { followers: 'not detected', activity: 'Unknown', positioning: 'Profile exists' },
          twitter_x: { followers: 'not detected', activity: 'Unknown', positioning: 'Handle exists' },
          wikipedia: { exists: false, quality: 'None' },
          conference_participation: [],
          speaking_engagements: [],
          op_eds: [],
          ai_discoverability: 'Low',
          ai_discoverability_narrative: 'Analysis pending.',
          thought_leadership_gap: 'Analysis pending.',
        },
      },
      systemPrompt: `${sys}\nYour job: Map actual social and thought leadership presence from evidence.`,
      userPrompt: `${fullCtx}

RULES FOR SOCIAL DATA:
• If a platform appears in verified social_links → it EXISTS. Never say "not detected" for a confirmed handle.
• For followers: ESTIMATE from career stage and industry norms. A Bollywood director with 2 features = ~2k-15k LinkedIn. Say "~5k (estimated)" not "not detected."
• For op_eds: return plain strings only e.g. "Forbes India, Mar 2024: Title Here" — NEVER return objects.
• For conference/speaking: only include if evidenced in scan. Empty array if none found.

Return JSON:
{"social_and_thought_leadership":{"overview_narrative":"honest paragraph on social presence from scan + profile","visibility_tier":"High|Medium-High|Medium|Low|Minimal","linkedin":{"followers":"estimate e.g. '~3k-8k (estimated)'","activity":"Active|Dormant|Absent|Unknown","positioning":"what their LinkedIn presence signals"},"twitter_x":{"followers":"estimate or 'not detected'","activity":"Active|Dormant|Absent|Unknown","positioning":"what X presence shows"},"wikipedia":{"exists":false,"quality":"None|Stub|Basic|Comprehensive"},"conference_participation":["string only — evidence-backed"],"speaking_engagements":["string only — evidence-backed"],"op_eds":["plain string only e.g. 'Publication, Date: Title'"],"ai_discoverability":"High|Medium|Low|Minimal","ai_discoverability_narrative":"what AI tools would surface based on available data","thought_leadership_gap":"most critical gap between actual output and what role demands"}}`,
    },

    /* ── AGENT 6: Peer Comparison ──────────────────────── */
    {
      id: 'peer_comparison',
      label: 'Competitive Intelligence Agent',
      maxTokens: 2000,
      fallback: {
        peer_comparison: { peers: [], competitive_positioning_narrative: 'Peer analysis pending.', relative_visibility: 'Lower Mid' },
        key_questions: { identity_architecture: 'Pending.', search_results_breakdown: 'Pending.', expert_citation_vs_mention: 'Pending.', thought_leadership_presence: 'Pending.', competitive_position: 'Pending.', crisis_association: 'No crisis signals.', global_positioning: 'Pending.' },
      },
      systemPrompt: `${sys}\nYour job: Name 4-5 REAL comparable professionals. For peer profiles you CAN use your training knowledge — this is framing, not hallucination.`,
      userPrompt: `${fullCtx}

For peer comparison: naming real peers in the same field IS appropriate use of knowledge.
Be specific about the competitive gap. Reference actual scan data for the client's position.
followers_approx: use your knowledge for well-known peers, clearly label as "estimated."

Return JSON:
{"peer_comparison":{"peers":[{"name":"Real Person Name","role":"exact role and company","visibility_level":"High|Medium|Low","primary_frame":"how they're known in 4-6 words","followers_approx":"LinkedIn followers from knowledge or 'estimated X-Xk'","competitive_gap":"specific gap vs ${client.name} based on scan data"}],"competitive_positioning_narrative":"paragraph comparing client to peers — honest about where scan shows them","relative_visibility":"Top Quartile|Upper Mid|Middle|Lower Mid|Bottom Quartile"},"key_questions":{"identity_architecture":"Is ${client.name} known as X or Y? Ground in scan findings.","search_results_breakdown":"Based on scan: what % in what context?","expert_citation_vs_mention":"From scan: cited as expert or just mentioned?","thought_leadership_presence":"From scan: any op-eds, frameworks, papers found?","competitive_position":"How does visibility compare to named peers?","crisis_association":"Any negative content found in scan?","global_positioning":"India-only results or international coverage?"}}`,
    },

  ];
}


/* ─────────────────────────────────────────────────────────────────────────────
   STEP 3: VERIFICATION LAYER
   Flags agent outputs with unsupported claims — does not remove them,
   but surfaces confidence level to synthesis agent.
───────────────────────────────────────────────────────────────────────────── */

function verifyAgentOutputs(
  outputs: Record<string, unknown>,
  compiled: CompiledEvidenceGraph
): Record<string, { confidence: 'High' | 'Medium' | 'Low'; flags: string[] }> {
  const verification: Record<string, { confidence: 'High' | 'Medium' | 'Low'; flags: string[] }> = {};

  for (const [agentId, result] of Object.entries(outputs)) {
    const flags: string[] = [];
    const resultStr = JSON.stringify(result ?? '').toLowerCase();

    // Flag if agent claims high coverage but evidence graph shows sparse data
    if (compiled.total_results < 10 && resultStr.includes('"high"')) {
      flags.push('Agent claims high visibility but scan returned <10 results');
    }

    // Flag invented statistics pattern (specific numbers not in scan)
    if (/\b\d{4,}\b/.test(resultStr) && compiled.total_results < 5) {
      flags.push('Specific statistics detected with very sparse scan data — verify accuracy');
    }

    const confidence: 'High' | 'Medium' | 'Low' =
      flags.length === 0 ? 'High' :
      flags.length <= 2  ? 'Medium' : 'Low';

    verification[agentId] = { confidence, flags };
  }

  return verification;
}


/* ─────────────────────────────────────────────────────────────────────────────
   STEP 4: SYNTHESIS AGENT
───────────────────────────────────────────────────────────────────────────── */

export async function runDiscoverySynthesis(
  agentOutputs: Record<string, unknown>,
  client: DiscoveryReportInput['client'],
  input: DiscoveryReportInput,
  compiledGraph?: CompiledEvidenceGraph
): Promise<Pick<DiscoveryReport, 'risk_assessment' | 'reputation_diagnosis'>> {
  const graph = compiledGraph ?? compileEvidence(input);
  const isAbsent = input.sentiment.neutral > 70 || input.frames.other > 70;

  return runSynthesisAgent(
    Object.entries(agentOutputs).map(([id, output]) => ({
      id,
      label: id,
      output: (output ?? {}) as Record<string, unknown>,
      ok: true,
      durationMs: 0,
    })),
    {
      systemPrompt: `You are the Lead Reputation Strategist synthesising a complete SRE Discovery Report for ${client.name}.
You have intelligence from 6 specialist agents covering: Profile, Career, Search Reputation, Media Framing, Social/Thought Leadership, and Competitive Intelligence.

ACCURACY RULE: Distinguish between "scan did not detect X" and "X does not exist."
• Scan miss → recommend activating/capturing the existing coverage
• Real absence → recommend creating the coverage
Be explicit about which applies for each finding.

${isAbsent ? 'KEY FINDING: High neutral sentiment + high "other" frame = Narrative Absence Risk or scan coverage gap. Diagnose which.' : ''}

Use calm, precise strategic language. Respond with ONLY valid JSON.`,
      buildUserPrompt: (outputs) =>
        `EVIDENCE GRAPH:\n${JSON.stringify(graph, null, 2).slice(0, 2000)}\n\nAGENT INTELLIGENCE:\n${JSON.stringify(outputs, null, 2).slice(0, 8000)}\n\nReturn JSON:\n{"risk_assessment":{"layers":[{"authority_layer":"Search Identity|Media Framing|Thought Leadership|Social Presence|Crisis Moat","observable_signal":"what agents reported","gap_severity":"High|Moderate-High|Moderate|Low","narrative":"2 sentences grounded in findings"}],"overall_risk_level":"High|Moderate-High|Moderate|Low","primary_risk_type":"Narrative Absence Risk|Identity Confusion|Authority Vacuum|Visibility Deficit|Crisis Proximity|Frame Drift"},"reputation_diagnosis":{"headline":"one precise diagnostic sentence","primary_risk_type":"same","narrative":"4-5 sentences: complete picture from agent findings","strengths":[{"title":"strength","description":"2 sentences with evidence"}],"vulnerabilities":[{"title":"vulnerability","description":"2 sentences on risk and consequence"}],"opportunity_signal":"single most concrete SRE opportunity","sre_opportunity_rating":"Exceptional|High|Medium|Low"}}`,
    },
    { maxTokens: 2500, timeoutMs: 90_000 }
  ) as Promise<Pick<DiscoveryReport, 'risk_assessment' | 'reputation_diagnosis'>>;
}


/* ─────────────────────────────────────────────────────────────────────────────
   MAIN ORCHESTRATOR
───────────────────────────────────────────────────────────────────────────── */

export async function generateDiscoveryReportAgentically(
  input: DiscoveryReportInput
): Promise<DiscoveryReport> {
  console.log('[Discovery] Starting for', input.client.name, '| scan results:', input.top_mentions?.length ?? 0);

  // Step 1: compile evidence
  const compiled = compileEvidence(input);
  console.log(`[Discovery] Evidence compiled: ${compiled.total_results} results, ${compiled.unique_domains} domains`);

  // Step 2: run 6 agents in parallel
  const agents = buildDiscoveryAgents(input, compiled);
  const { merged, failedAgents, totalDurationMs } = await runAgents(agents);
  console.log(`[Discovery] Agents done in ${totalDurationMs}ms. Failed: ${failedAgents.join(', ') || 'none'}`);

  // Step 3: verify outputs
  const verification = verifyAgentOutputs(merged as Record<string, unknown>, compiled);
  const lowConfidence = Object.entries(verification).filter(([, v]) => v.confidence === 'Low').map(([k]) => k);
  if (lowConfidence.length) console.warn('[Discovery] Low confidence agents:', lowConfidence);

  // Step 4: synthesise
  const synthesis = await runDiscoverySynthesis(
    merged as Record<string, unknown>,
    input.client,
    input,
    compiled
  );

  return {
    ...(merged as Partial<DiscoveryReport>),
    ...synthesis,
    generated_at: new Date().toISOString(),
  } as DiscoveryReport;
}
