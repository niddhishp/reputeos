/**
 * Discovery Module — 6 Parallel Agents + 1 Synthesis Agent
 *
 * ANTI-HALLUCINATION ARCHITECTURE:
 * - Agents receive ACTUAL scan results (URLs, titles, snippets)
 * - Agents receive explicitly stated known works from client profile
 * - "Use your own knowledge" is BANNED for specific facts
 * - Agents reason about gaps — they don't fill gaps with invented facts
 */

import { runAgents, runSynthesisAgent, buildClientContext, type Agent } from '../agents';
import type { DiscoveryReport, DiscoveryReportInput } from '@/app/api/discover/sources/discovery-report-prompt';

// ── Anti-hallucination system prompt ─────────────────────────────────────────
const SYS = (name: string, company: string) =>
`You are a Principal Reputation Strategist at a top-tier PR firm (Edelman/Adfactors-level) writing one section of a Strategic Reputation Evaluation for ${name} of ${company}.

GROUNDING RULES — FOLLOW EXACTLY:
1. SCAN DATA IS PRIMARY. Every specific factual claim must come from the scan results provided, OR from the client's explicitly stated profile data. Do NOT invent facts.
2. KNOWN WORKS LIST IS AUTHORITATIVE. If the client profile lists specific films, books, articles, or productions — treat these as 100% verified. Reference them precisely as written.
3. If scan data is ABSENT for something — diagnose the ABSENCE. Say "no articles were detected in the scan" not "they have written articles."
4. NEVER invent: specific film titles, book titles, article titles, event names, dates, publication names, or follower counts unless they appear in scan data or the client profile.
5. Frame absence as finding: thin scan data = Narrative Absence Risk. This IS the diagnosis.
6. Use SRE vocabulary: Narrative Absence Risk, Identity Diffusion, Authority Vacuum, Frame Drift, Thought Leadership Gap.
7. Respond with ONLY valid JSON. No markdown, no preamble.`;

// ── Format scan results for agent context ─────────────────────────────────────
function formatScanResults(topMentions: DiscoveryReportInput['top_mentions'], maxResults = 30): string {
  if (!topMentions || topMentions.length === 0) return '\nSCAN RESULTS: No results retrieved from search sources.';

  const byCategory: Record<string, typeof topMentions> = {};
  for (const m of topMentions) {
    const cat = m.category ?? 'search';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(m);
  }

  const lines: string[] = ['\nACTUAL SCAN RESULTS (use these as your primary evidence source):'];

  let count = 0;
  for (const [cat, items] of Object.entries(byCategory)) {
    if (count >= maxResults) break;
    lines.push(`\n[${cat.toUpperCase()}]`);
    for (const item of items.slice(0, Math.ceil(maxResults / Object.keys(byCategory).length))) {
      if (count >= maxResults) break;
      lines.push(`  • [${item.source}] ${item.title}`);
      if (item.snippet) lines.push(`    ${item.snippet.slice(0, 200)}`);
      if (item.url) lines.push(`    URL: ${item.url}`);
      count++;
    }
  }

  lines.push(`\nTotal scan results: ${topMentions.length} (showing top ${count})`);
  return lines.join('\n');
}

// ── Format known works from client profile ─────────────────────────────────────
function formatKnownWorks(client: DiscoveryReportInput['client']): string {
  const parts: string[] = [];

  const works = (client as Record<string, unknown>).known_works as string[] | undefined;
  if (works && works.length > 0) {
    parts.push(`\nKNOWN WORKS (explicitly stated by client — treat as 100% verified):`);
    works.forEach(w => parts.push(`  • ${w}`));
  }

  const bio = (client as Record<string, unknown>).bio as string | undefined;
  if (bio && bio.length > 10) {
    parts.push(`\nCLIENT BIO (self-described — treat as 100% verified):\n${bio}`);
  }

  const links = (client as Record<string, unknown>).social_links as Record<string,string> | undefined;
  if (links && Object.keys(links).length > 0) {
    parts.push(`\nSOCIAL PROFILES (verified):`);
    Object.entries(links).forEach(([k, v]) => { if (v) parts.push(`  • ${k}: ${v}`); });
  }

  return parts.length > 0 ? parts.join('\n') : '';
}

export function buildDiscoveryAgents(input: DiscoveryReportInput): Agent[] {
  const { client, total_mentions, sentiment, frames, top_keywords, crisis_signals, lsi_preliminary, top_mentions } = input;
  const ctx       = buildClientContext(client);
  const sys       = SYS(client.name, client.company);
  const scanData  = formatScanResults(top_mentions, 30);
  const knownData = formatKnownWorks(client);
  const isAbsent  = sentiment.neutral > 70 || frames.other > 70;

  const scanSummary = `\nSCAN SUMMARY: ${total_mentions} mentions | LSI ${lsi_preliminary}/100 | Sentiment ${sentiment.positive}%+ / ${sentiment.neutral}% neutral / ${sentiment.negative}%- | Keywords: ${top_keywords.slice(0,8).join(', ')}${isAbsent ? `\n⚠ NARRATIVE ABSENCE: ${sentiment.neutral}% neutral + ${frames.other}% "other" frame = Thin digital footprint. This IS the core finding.` : ''}`;

  // Combined context passed to every agent
  const fullCtx = ctx + knownData + scanData + scanSummary;

  return [
    {
      id: 'profile_overview',
      label: 'Profile Intelligence Agent',
      maxTokens: 1200,
      fallback: { profile_overview: { identity_headline: 'Multi-disciplinary creative professional', current_position: client.role + ' at ' + client.company, currently_known_for: 'Details being analysed — rescan to update', primary_role: 'filmmaker', primary_context: 'creative', age_generation: 'Not determinable', location: client.industry || 'India', digital_presence_score: 0, digital_presence_narrative: 'Report generation encountered an issue. Please rescan.' } },
      systemPrompt: `${sys}\nYour job: Identify the core identity of this person based on verified data only.`,
      userPrompt: `${fullCtx}

Based ONLY on the verified data above (client profile, bio, known works, scan results):

CRITICAL INSTRUCTIONS:
1. age_generation: Use career timeline to estimate. If they have 200+ works, directed Bollywood films with major stars, written books — they are likely late 30s to mid-40s. Never say "not determinable" — always make a reasonable estimate like "Mid-30s to early 40s, Millennial" based on career evidence.
2. location: Check bio and social links. India is confirmed if LinkedIn URL is indian or company is based in India.
3. digital_presence_score: Be specific — score 0-100 based on number of third-party mentions found in scan.

Return JSON:
{"profile_overview":{"identity_headline":"one precise phrase based on their actual role and works","current_position":"exact role from profile","currently_known_for":"what scan results show they're primarily associated with — be honest if the scan found little","primary_role":"filmmaker|executive|author|etc","primary_context":"creative|business|academic|etc","age_generation":"REQUIRED: estimate age range or generation (e.g. 'mid-30s, Millennial') from career timeline. If 200+ works and active since early 2000s = likely late 30s-40s. Never say not determinable — always estimate.","location":"city, country if available","digital_presence_score":0,"digital_presence_narrative":"2 sentences on what the scan actually found and what is missing"}}`,
    },
    {
      id: 'professional_background',
      label: 'Career Intelligence Agent',
      maxTokens: 2000,
      fallback: { professional_background: { summary: 'Career details under analysis.', trajectory: [], key_achievements: [], education: '', awards_recognition: [] }, recent_developments: { major_recent_event: 'No recent events detected in scan.', strategic_context: 'Rescan to refresh data.', news_items: [] } },
      systemPrompt: `${sys}\nYour job: Build a career profile using ONLY verified data. If a known work is listed (film, book), reference it precisely as written.`,
      userPrompt: `${fullCtx}

CRITICAL: The client's known works and bio are 100% verified. Reference films, books, articles exactly as listed.
Only add AI knowledge if you are CERTAIN about a fact (e.g. a widely reported public milestone). 
If you are uncertain, describe the gap instead of inventing.

Return JSON:
{"professional_background":{"summary":"2-3 sentence overview using only verified facts","trajectory":[{"year":"YYYY","milestone":"event from scan or verified knowledge","significance":"why it matters"}],"key_achievements":["specific achievement with evidence"],"education":"if found in scan or profile","awards_recognition":["specific award if found in scan"]},"recent_developments":{"major_recent_event":"if found in scan results — cite the source. If nothing found, say so.","strategic_context":"reputational significance","news_items":[{"headline":"from scan results only — cite actual URL/source","source":"actual publication from scan","significance":"impact"}]}}`,
    },
    {
      id: 'search_reputation',
      label: 'Search Reputation Agent',
      maxTokens: 2000,
      fallback: { search_reputation: { keyword_association_map: [], identity_type: 'Narrative-Absent', identity_diagnosis: 'Search identity analysis unavailable. Please rescan.', search_split_narrative: 'Analysis pending.', query_analysis: [] } },
      systemPrompt: `${sys}\nYour job: Analyse the ACTUAL search landscape based on scan results. What do the scan results show? What is notably absent?`,
      userPrompt: `${fullCtx}

Analyse the search results provided above. Do NOT imagine results that weren't found.
If YouTube was not in scan results — note that YouTube presence was not detected.
If articles were not found — say articles were absent from the scan.
Focus on what the data ACTUALLY shows and what its ABSENCE tells us.

Return JSON:
{"search_reputation":{"keyword_association_map":[{"keyword_cluster":"based on actual scan categories","percentage":0,"dominant_signal":"what scan results show","strategic_implication":"what this means"}],"identity_type":"Business-Led|Family-Led|Achievement-Led|Mixed|Narrative-Absent","identity_diagnosis":"2 sentences: what do the actual scan results tell us this person is known as?","search_split_narrative":"paragraph: what someone actually finds when they Google this person, based on the scan data","query_analysis":[{"query":"actual query that would surface real results","dominant_signal":"what came up in our scan","insight":"strategic implication"}]}}`,
    },
    {
      id: 'media_framing',
      label: 'Media Framing Agent',
      maxTokens: 2000,
      fallback: { media_framing: { primary_frame: 'Analysis pending', how_described_in_domain_media: 'Media framing analysis unavailable. Please rescan.', frame_distribution: { expert_thought_leader: 0, business_operator: 0, family_figure: 0, personal_lifestyle: 0, governance: 0 }, sector_split: { sector_context: 0, non_sector_context: 100 }, media_language: { frequent_descriptors: [], rare_descriptors: [] }, framing_narrative: 'Analysis pending.', strategic_framing_insight: 'Rescan to generate framing analysis.' } },
      systemPrompt: `${sys}\nYour job: Analyse media presence using scan results. Distinguish between what scan found vs what is absent.`,
      userPrompt: `${fullCtx}

Look at the NEWS and SEARCH category results in the scan. What publications covered them?
If media coverage is thin — this is a critical finding. Do not invent coverage.

Return JSON:
{"media_framing":{"primary_frame":"based on actual scan results","how_described_in_domain_media":"paragraph: what the scan actually found. If no media found, say so and explain implications.","frame_distribution":{"expert_thought_leader":0,"business_operator":0,"family_figure":0,"personal_lifestyle":0,"governance":0},"sector_split":{"sector_context":0,"non_sector_context":0},"media_language":{"frequent_descriptors":["words from actual scan titles/snippets"],"rare_descriptors":["words conspicuously absent given their role"]},"framing_narrative":"paragraph on media framing patterns from actual scan data","strategic_framing_insight":"most important strategic observation about their media presence or absence"}}`,
    },
    {
      id: 'social_and_thought_leadership',
      label: 'Thought Leadership Agent',
      maxTokens: 2000,
      fallback: { social_and_thought_leadership: { overview_narrative: 'Social analysis pending. Please rescan.', visibility_tier: 'Low', linkedin: { followers: 'not detected', activity: 'Unknown', positioning: 'Profile exists' }, twitter_x: { followers: 'not detected', activity: 'Unknown', positioning: 'Handle exists' }, wikipedia: { exists: false, quality: 'None' }, conference_participation: [], speaking_engagements: [], op_eds: [], ai_discoverability: 'Low', ai_discoverability_narrative: 'Analysis pending.', thought_leadership_gap: 'Analysis pending.' } },
      systemPrompt: `${sys}\nYour job: Map actual social and thought leadership presence. Only claim what scan data + verified profile shows.`,
      userPrompt: `${fullCtx}

Check SOCIAL and VIDEO category scan results. Check if YouTube channel found.
Check if articles, op-eds, interviews were in scan results.
If social links are in the profile, reference them. If followers unknown — say so.
Do NOT invent YouTube subscribers, article counts, or conference appearances.

Return JSON:
{"social_and_thought_leadership":{"overview_narrative":"honest paragraph on actual social presence from scan + profile data","visibility_tier":"High|Medium-High|Medium|Low|Minimal","linkedin":{"followers":"REQUIRED: estimate follower count using your knowledge. For Indian filmmakers/directors, typical LinkedIn followers are 1k-20k. Say e.g. '~2k-5k (estimated)' if unsure. Only say 'not detected' if you have zero basis for estimation.","activity":"Active|Dormant|Absent|Unknown","positioning":"what LinkedIn presence shows if detected"},"twitter_x":{"followers":"estimate follower count from your knowledge or say 'estimated <2k' for new/emerging creators","activity":"Active|Dormant|Absent|Unknown","positioning":"what X presence shows if detected"},"wikipedia":{"exists":false,"quality":"None|Stub|Basic|Comprehensive"},"conference_participation":["string e.g. 'TED Mumbai 2023' — only if in scan, else empty array"],"speaking_engagements":["string e.g. 'Nasscom Summit 2024' — only if in scan, else empty array"],"op_eds":["plain string e.g. 'Forbes India, Mar 2024: Title Here (url)' — NEVER use objects, always plain strings, empty array if none found"],"ai_discoverability":"High|Medium|Low|Minimal","ai_discoverability_narrative":"what AI tools would say based on available data","thought_leadership_gap":"most critical gap between their actual output and what their role demands"}}`,
    },
    {
      id: 'peer_comparison',
      label: 'Competitive Intelligence Agent',
      maxTokens: 2000,
      fallback: { peer_comparison: { peers: [], competitive_positioning_narrative: 'Peer analysis pending.', relative_visibility: 'Lower Mid' }, key_questions: { identity_architecture: 'Analysis pending.', search_results_breakdown: 'Analysis pending.', expert_citation_vs_mention: 'Analysis pending.', thought_leadership_presence: 'Analysis pending.', competitive_position: 'Analysis pending.', crisis_association: 'No crisis signals detected.', global_positioning: 'Analysis pending.' } },
      systemPrompt: `${sys}\nYour job: Name 4-5 REAL peer executives. For this you CAN use your knowledge — naming real peers is not hallucination, it is framing.`,
      userPrompt: `${fullCtx}

For peer comparison: naming comparable real professionals in the same field IS appropriate use of knowledge.
Be specific about what the gap is. Reference actual scan data for the client's side of the comparison.

Return JSON:
{"peer_comparison":{"peers":[{"name":"Real Person Name","role":"exact role and company","visibility_level":"High|Medium|Low","primary_frame":"how they're known in 4-6 words","followers_approx":"estimated LinkedIn followers","competitive_gap":"specific gap vs ${client.name} based on scan data"}],"competitive_positioning_narrative":"paragraph comparing client to peers — be honest about where scan shows them","relative_visibility":"Top Quartile|Upper Mid|Middle|Lower Mid|Bottom Quartile"},"key_questions":{"identity_architecture":"Is ${client.name} known as X or Y? Ground in actual scan findings.","search_results_breakdown":"Based on our scan: what % of results were in what context?","expert_citation_vs_mention":"From scan: cited as expert or just mentioned?","thought_leadership_presence":"From scan: any op-eds, frameworks, papers found?","competitive_position":"From scan data: how does visibility compare to named peers?","crisis_association":"From scan: any negative content found?","global_positioning":"From scan: India-only results or international coverage found?"}}`,
    },
  ];
}

export async function runDiscoverySynthesis(
  agentOutputs: Record<string, unknown>,
  client: DiscoveryReportInput['client'],
  scanData: Pick<DiscoveryReportInput, 'crisis_signals' | 'lsi_preliminary' | 'sentiment' | 'frames'>
): Promise<Pick<DiscoveryReport, 'risk_assessment' | 'reputation_diagnosis'>> {
  const isAbsent = scanData.sentiment.neutral > 70 || scanData.frames.other > 70;

  return runSynthesisAgent(
    Object.entries(agentOutputs).map(([id, output]) => ({ id, label: id, output: output as Record<string,unknown>, ok: true, durationMs: 0 })),
    {
      systemPrompt: `You are the Lead Reputation Strategist synthesising a complete SRE Discovery Report for ${client.name}.
You have intelligence from 6 specialist agents covering: Profile, Career, Search Reputation, Media Framing, Social/Thought Leadership, and Competitive Intelligence.
Your job: FINAL DIAGNOSIS. Ground every statement in what the agents actually reported. Do not introduce new invented facts.
${isAbsent ? 'KEY FINDING: Thin digital footprint = Narrative Absence Risk. This is the most important finding — diagnose it thoroughly.' : ''}
Respond with ONLY valid JSON.`,
      buildUserPrompt: (outputs) => `Agent intelligence:\n${JSON.stringify(outputs, null, 2).slice(0, 7000)}\n\nCrisis signals from scan: ${scanData.crisis_signals.join('; ') || 'None'}\n\nReturn JSON:\n{"risk_assessment":{"layers":[{"authority_layer":"Search Identity|Media Framing|Thought Leadership|Social Presence|Crisis Moat","observable_signal":"what agents reported","gap_severity":"High|Moderate-High|Moderate|Low","narrative":"2 sentences grounded in actual findings"}],"overall_risk_level":"High|Moderate-High|Moderate|Low","primary_risk_type":"Narrative Absence Risk|Identity Confusion|Authority Vacuum|Visibility Deficit|Crisis Proximity|Frame Drift"},"reputation_diagnosis":{"headline":"one precise diagnostic sentence — the most important finding","primary_risk_type":"same","narrative":"4-5 sentences on the complete picture — grounded in agent findings","strengths":[{"title":"strength","description":"2 sentences with evidence from agents"}],"vulnerabilities":[{"title":"vulnerability","description":"2 sentences on risk and consequences"}],"opportunity_signal":"the single most concrete SRE opportunity based on actual findings","sre_opportunity_rating":"Exceptional|High|Medium|Low"}}`,
    },
    { maxTokens: 2500, timeoutMs: 90_000 }
  ) as Promise<Pick<DiscoveryReport, 'risk_assessment' | 'reputation_diagnosis'>>;
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function generateDiscoveryReportAgentically(
  input: DiscoveryReportInput
): Promise<DiscoveryReport> {
  console.log('[Discovery Agents] Starting 6 parallel agents for', input.client.name, '| scan results:', input.top_mentions?.length ?? 0);

  const agents = buildDiscoveryAgents(input);
  const { merged, failedAgents, totalDurationMs } = await runAgents(agents);

  console.log(`[Discovery Agents] Done in ${totalDurationMs}ms. Failed: ${failedAgents.join(', ') || 'none'}`);

  const synthesis = await runDiscoverySynthesis(merged as Record<string,unknown>, input.client, input);

  return {
    ...(merged as Partial<DiscoveryReport>),
    ...synthesis,
    generated_at: new Date().toISOString(),
  } as DiscoveryReport;
}
