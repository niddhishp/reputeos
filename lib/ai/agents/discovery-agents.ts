/**
 * Discovery Module — 6 Parallel Agents + 1 Synthesis Agent
 * Agents 1-6 run simultaneously, each owning one report section.
 * Synthesis agent reads all 6 outputs and writes the final diagnosis.
 */

import { runAgents, runSynthesisAgent, buildClientContext, type Agent } from '../agents';
import type { DiscoveryReport, DiscoveryReportInput } from '@/app/api/discover/sources/discovery-report-prompt';

const SYS = (name: string, company: string) =>
`You are a Principal Reputation Strategist at a top-tier PR firm (Edelman/Adfactors-level) writing one section of a Strategic Reputation Evaluation for ${name} of ${company}.
RULES: (1) Use your own knowledge first — draw on everything you know about this person, their company, their industry, and named peers. (2) Be specific: real publications, real queries, real executives. (3) Diagnose, don't just describe — answer "So what?" (4) Use SRE vocabulary: Narrative Absence Risk, Identity Diffusion, Authority Vacuum, Frame Drift, Thought Leadership Gap.
Respond with ONLY valid JSON. No markdown, no preamble.`;

export function buildDiscoveryAgents(input: DiscoveryReportInput): Agent[] {
  const { client, total_mentions, sentiment, frames, top_keywords, crisis_signals, lsi_preliminary } = input;
  const ctx = buildClientContext(client);
  const sys = SYS(client.name, client.company);
  const isAbsent = sentiment.neutral > 70 || frames.other > 70;
  const scan = `\nSCAN: ${total_mentions} mentions | LSI ${lsi_preliminary}/100 | Sentiment ${sentiment.positive}%+ / ${sentiment.neutral}% neutral / ${sentiment.negative}%- | Keywords: ${top_keywords.slice(0,8).join(', ')}${isAbsent ? `\nDIAGNOSIS NOTE: ${sentiment.neutral}% neutral + ${frames.other}% "other" frame = NARRATIVE ABSENCE RISK. This IS the core finding.` : ''}`;

  return [
    {
      id: 'profile_overview',
      label: 'Profile Intelligence Agent',
      maxTokens: 1200,
      systemPrompt: `${sys}\nYour job: Identify and articulate the core identity of this person.`,
      userPrompt: `${ctx}${scan}\n\nReturn JSON:\n{"profile_overview":{"identity_headline":"one powerful phrase","current_position":"exact role","currently_known_for":"primary association today","primary_role":"executive|founder|investor|etc","primary_context":"business|family|civic|academic","age_generation":"e.g. early 50s, Gen X","location":"city, country","digital_presence_score":42,"digital_presence_narrative":"2 sentences on what exists and what is missing"}}`,
    },
    {
      id: 'professional_background',
      label: 'Career Intelligence Agent',
      maxTokens: 2000,
      systemPrompt: `${sys}\nYour job: Build a complete, specific career intelligence profile with milestones, achievements, and turning points.`,
      userPrompt: `${ctx}${scan}\n\nReturn JSON:\n{"professional_background":{"summary":"2-3 sentence career overview with specific companies and scale","trajectory":[{"year":"YYYY","milestone":"specific event","significance":"reputational meaning"}],"key_achievements":["achievement with numbers","another achievement"],"education":"degrees, institutions","awards_recognition":["award, year, issuer"]},"recent_developments":{"major_recent_event":"most significant news in last 12 months","strategic_context":"reputational significance","news_items":[{"headline":"specific headline","source":"real publication","significance":"reputational impact"}]}}`,
    },
    {
      id: 'search_reputation',
      label: 'Search Reputation Agent',
      maxTokens: 2000,
      systemPrompt: `${sys}\nYour job: Map exactly what someone finds when they Google this person. Analyse the search identity landscape.`,
      userPrompt: `${ctx}${scan}\n\nImagine Googling "${client.name}" right now. What are the top 10 results? What % are business vs family vs crisis? What queries do journalists/investors use?\n\nReturn JSON:\n{"search_reputation":{"keyword_association_map":[{"keyword_cluster":"e.g. Fintech/Payments","percentage":45,"dominant_signal":"what this signals","strategic_implication":"SRE meaning"}],"identity_type":"Business-Led|Family-Led|Achievement-Led|Mixed|Narrative-Absent","identity_diagnosis":"2 sentences: what type of person do search results say this is?","search_split_narrative":"paragraph on the full search landscape — specific sources and framing","query_analysis":[{"query":"exact Google query a journalist would use","dominant_signal":"what dominates results","insight":"strategic implication"}]}}`,
    },
    {
      id: 'media_framing',
      label: 'Media Framing Agent',
      maxTokens: 2000,
      systemPrompt: `${sys}\nYour job: Analyse how press, media, and publications frame and describe this person.`,
      userPrompt: `${ctx}${scan}\n\nHow do ET, Bloomberg, Mint, sector publications describe them? Expert? Operator? Family scion? Crisis figure?\n\nReturn JSON:\n{"media_framing":{"primary_frame":"dominant media frame in 4-6 words","how_described_in_domain_media":"paragraph naming specific publications","frame_distribution":{"expert_thought_leader":0,"business_operator":0,"family_figure":0,"personal_lifestyle":0,"governance":0},"sector_split":{"sector_context":0,"non_sector_context":0},"media_language":{"frequent_descriptors":["actual words used"],"rare_descriptors":["words that should be there but aren't"]},"framing_narrative":"paragraph: what story does media tell? What is emphasised, what is missing?","strategic_framing_insight":"the one thing a reputation strategist would flag immediately"}}`,
    },
    {
      id: 'social_and_thought_leadership',
      label: 'Thought Leadership Agent',
      maxTokens: 2000,
      systemPrompt: `${sys}\nYour job: Map social presence, content output, thought leadership footprint, and AI discoverability.`,
      userPrompt: `${ctx}${scan}\n\nEstimate followers, activity, content quality. Check: Wikipedia? Op-eds? Conference speaking? How does ChatGPT/Perplexity describe them?\n\nReturn JSON:\n{"social_and_thought_leadership":{"overview_narrative":"paragraph on overall presence — be honest about gaps","visibility_tier":"High|Medium-High|Medium|Low|Minimal","linkedin":{"followers":"e.g. 12,000","activity":"Active|Dormant|Absent","positioning":"how they present"},"twitter_x":{"followers":"estimate","activity":"Active|Dormant|Absent","positioning":"what they post"},"wikipedia":{"exists":false,"quality":"None|Stub|Basic|Comprehensive"},"conference_participation":["conference name, year"],"speaking_engagements":["event, topic"],"op_eds":["publication, approximate date"],"ai_discoverability":"High|Medium|Low|Minimal","ai_discoverability_narrative":"what AI tools say about this person","thought_leadership_gap":"the single most critical missing piece"}}`,
    },
    {
      id: 'peer_comparison',
      label: 'Competitive Intelligence Agent',
      maxTokens: 2000,
      systemPrompt: `${sys}\nYour job: Identify 4-5 real named peer executives. Build a rigorous competitive visibility map. Name real people.`,
      userPrompt: `${ctx}${scan}\n\nWho are the real peers? CEOs of comparable companies, same sector, same scale?\n\nReturn JSON:\n{"peer_comparison":{"peers":[{"name":"Real Executive Name","role":"exact role and company","visibility_level":"High|Medium|Low","primary_frame":"how they are known in 4-6 words","followers_approx":"estimated LinkedIn followers","competitive_gap":"honest comparison to ${client.name}"}],"competitive_positioning_narrative":"paragraph: where does ${client.name} sit in the peer landscape?","relative_visibility":"Top Quartile|Upper Mid|Middle|Lower Mid|Bottom Quartile"},"key_questions":{"identity_architecture":"Is ${client.name} primarily known as X or Y?","search_results_breakdown":"Top 10 Google results — % in each context","expert_citation_vs_mention":"Cited as expert or just mentioned? Evidence?","thought_leadership_presence":"Any original frameworks, op-eds, papers?","competitive_position":"Visibility vs named peers above?","crisis_association":"Any negative content or controversies?","global_positioning":"International recognition or domestic only?"}}`,
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
      systemPrompt: `You are the Lead Reputation Strategist synthesising a complete SRE Discovery Report for ${client.name} of ${client.company}.
You have received intelligence from 6 specialist agents covering: Profile, Career, Search Reputation, Media Framing, Social/Thought Leadership, and Competitive Intelligence.
Your job: Produce the FINAL DIAGNOSIS — the most important section of the report. The client reads this first.
Be brutally honest, diagnostically precise, and strategically insightful.${isAbsent ? '\nKEY: This person has Narrative Absence Risk. Thin digital footprint = enormous opportunity AND enormous risk.' : ''}
Respond with ONLY valid JSON. No markdown.`,
      buildUserPrompt: (outputs) => `Intelligence from 6 agents:\n${JSON.stringify(outputs, null, 2).slice(0, 7000)}\n\nCrisis signals: ${scanData.crisis_signals.join('; ') || 'None'}\n\nReturn JSON:\n{"risk_assessment":{"layers":[{"authority_layer":"Search Identity|Media Framing|Thought Leadership|Social Presence|Crisis Moat","observable_signal":"what we observe","gap_severity":"High|Moderate-High|Moderate|Low","narrative":"2 sentences on the risk"}],"overall_risk_level":"High|Moderate-High|Moderate|Low","primary_risk_type":"Narrative Absence Risk|Identity Confusion|Authority Vacuum|Visibility Deficit|Crisis Proximity|Frame Drift"},"reputation_diagnosis":{"headline":"one devastatingly precise sentence — the most important thing a CEO needs to hear","primary_risk_type":"same","narrative":"4-5 sentences on the complete picture — what is the situation, what are the stakes, what must change?","strengths":[{"title":"strength","description":"2 sentences with specific evidence"}],"vulnerabilities":[{"title":"vulnerability","description":"2 sentences on risk and consequences"}],"opportunity_signal":"the single most concrete SRE opportunity right now","sre_opportunity_rating":"Exceptional|High|Medium|Low"}}`,
    },
    { maxTokens: 2500, timeoutMs: 90_000 }
  ) as Promise<Pick<DiscoveryReport, 'risk_assessment' | 'reputation_diagnosis'>>;
}

// ── Main orchestrator function ─────────────────────────────────────────────────

export async function generateDiscoveryReportAgentically(
  input: DiscoveryReportInput
): Promise<DiscoveryReport> {
  console.log('[Discovery Agents] Starting 6 parallel agents for', input.client.name);

  const agents = buildDiscoveryAgents(input);
  const { merged, failedAgents, totalDurationMs } = await runAgents(agents);

  console.log(`[Discovery Agents] 6 agents done in ${totalDurationMs}ms. Failed: ${failedAgents.join(', ') || 'none'}`);

  // Synthesis agent reads all 6 outputs
  console.log('[Discovery Agents] Starting synthesis agent...');
  const synthesis = await runDiscoverySynthesis(merged as Record<string,unknown>, input.client, input);

  const report: DiscoveryReport = {
    ...(merged as Partial<DiscoveryReport>),
    ...synthesis,
    generated_at: new Date().toISOString(),
  } as DiscoveryReport;

  return report;
}
