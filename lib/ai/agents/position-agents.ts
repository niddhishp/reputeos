/**
 * Position Module — 4 Parallel Agents + 1 Synthesis Agent
 */
import { runAgents, runSynthesisAgent, buildClientContext } from '../agents';

export interface PositionInput {
  client: { name: string; role?: string; company?: string; industry?: string; keywords?: string[] };
  archetypes: { personal: string; business?: string };
  discoverData?: { topKeywords?: string[]; frames?: Record<string, number>; crisisSignals?: string[] };
  lsiScore?: number;
}

export interface PositionStrategy {
  archetype_analysis: { fit_score: number; confidence: number; rationale: string; voice_profile: string[]; anti_patterns: string[] };
  followability: { score: number; factors: Record<string, number>; benchmark: string; narrative: string };
  content_pillars: Array<{ name: string; why: string; themes: string[]; frequency: string; formats: string[]; sample_angle: string }>;
  influencer_map: Array<{ name: string; platform: string; archetype: string; why_relevant: string; engagement_strategy: string; dna_elements: string[] }>;
  positioning_statement: string;
  signature_lines: string[];
  content_strategy_narrative: string;
}

export function buildPositionAgents(input: PositionInput) {
  const { client, archetypes, discoverData, lsiScore } = input;
  const ctx = buildClientContext(client);
  const archetypeCtx = `Personal archetype: ${archetypes.personal}${archetypes.business ? ` | Business archetype: ${archetypes.business}` : ''}`;
  const discoverCtx = discoverData ? `\nDiscover data: keywords: ${discoverData.topKeywords?.slice(0,8).join(', ')} | crisis signals: ${discoverData.crisisSignals?.join('; ') || 'none'}` : '';
  const sys = `You are a Senior Brand Strategist specialising in executive reputation positioning. You are building the strategic foundation for ${client.name}'s thought leadership.
Be specific, contrarian where needed, and deeply strategic. Name real influencers and publications.
Respond with ONLY valid JSON. No markdown.`;

  return [
    {
      id: 'archetype_analysis',
      label: 'Archetype Analyst Agent',
      maxTokens: 1500,
      systemPrompt: `${sys}\nYour job: Deeply analyse archetype fit and define the authentic voice profile.`,
      userPrompt: `${ctx}\n${archetypeCtx}${discoverCtx}\nLSI: ${lsiScore ?? 'unknown'}/100\n\nReturn JSON:\n{"archetype_analysis":{"fit_score":85,"confidence":78,"rationale":"3 sentences: why this archetype fits, what makes it authentic, any tension points","voice_profile":["specific voice characteristic 1","characteristic 2","characteristic 3"],"anti_patterns":["what to avoid: pattern 1","pattern 2"]}}`,
    },
    {
      id: 'followability',
      label: 'Followability Predictor Agent',
      maxTokens: 1200,
      systemPrompt: `${sys}\nYour job: Predict followability score based on 5 factors and benchmark against real peers.`,
      userPrompt: `${ctx}\n${archetypeCtx}${discoverCtx}\n\nReturn JSON:\n{"followability":{"score":72,"factors":{"uniqueness":70,"emotional_resonance":75,"content_opportunity":80,"platform_fit":68,"historical_performance":65},"benchmark":"compare to named peer executives in same industry","narrative":"3 sentences: what drives this score, what would increase it most, what is the ceiling?"}}`,
    },
    {
      id: 'content_pillars',
      label: 'Content Strategy Agent',
      maxTokens: 2500,
      systemPrompt: `${sys}\nYour job: Design 5 content pillars that are specific, ownable, and aligned to archetype and industry. Each pillar should be a platform for thought leadership.`,
      userPrompt: `${ctx}\n${archetypeCtx}${discoverCtx}\n\nDesign 5 content pillars. Each must be specific to ${client.name}'s expertise and industry — not generic.\n\nReturn JSON:\n{"content_pillars":[{"name":"pillar name","why":"why this pillar is ownable and strategic for this person","themes":["specific theme 1","theme 2","theme 3"],"frequency":"e.g. 2x per week","formats":["LinkedIn long-form","Op-ed","Thread"],"sample_angle":"a specific content angle they could publish this week"}]}`,
    },
    {
      id: 'influencer_map',
      label: 'Influencer Intelligence Agent',
      maxTokens: 2000,
      systemPrompt: `${sys}\nYour job: Identify 6-8 real, named influencers whose content DNA ${client.name} should study. These are aspirational peers — not celebrities, but domain authorities.`,
      userPrompt: `${ctx}\n${archetypeCtx}${discoverCtx}\n\nIdentify real influencers in ${client.industry} and adjacent domains whose content structure, style, and positioning ${client.name} should analyse.\n\nReturn JSON:\n{"influencer_map":[{"name":"Real Person Name","platform":"LinkedIn|Twitter|Substack","archetype":"their archetype","why_relevant":"why their DNA is useful for ${client.name}","engagement_strategy":"how to engage with them authentically","dna_elements":["content structure element","style element","engagement trigger"]}]}`,
    },
  ];
}

export async function generatePositionStrategyAgentically(input: PositionInput): Promise<PositionStrategy> {
  console.log('[Position Agents] Starting 4 parallel agents for', input.client.name);
  const agents = buildPositionAgents(input);
  const { merged, totalDurationMs, failedAgents } = await runAgents(agents);
  console.log(`[Position Agents] Done in ${totalDurationMs}ms. Failed: ${failedAgents.join(',') || 'none'}`);

  // Synthesis: positioning statement + narrative
  const synthesis = await runSynthesisAgent(
    Object.entries(merged as Record<string,unknown>).map(([id, output]) => ({ id, label: id, output: output as Record<string,unknown>, ok: true, durationMs: 0 })),
    {
      systemPrompt: `You are synthesising a complete positioning strategy for ${input.client.name}. Based on archetype analysis, followability prediction, content pillars, and influencer mapping, write the core positioning statement and 3 signature lines.\nRespond with ONLY valid JSON.`,
      buildUserPrompt: (outputs) => `Strategy intelligence:\n${JSON.stringify(outputs, null, 2).slice(0, 5000)}\n\nReturn JSON:\n{"positioning_statement":"one paragraph: the definitive statement of who ${input.client.name} is, what they stand for, and why they matter — written as an internal strategic brief, not a bio","signature_lines":["signature line 1 — a punchy 10-15 word line they could use anywhere","signature line 2","signature line 3"],"content_strategy_narrative":"2-3 sentences on the overarching content strategy rationale"}`,
    },
    { maxTokens: 1000, timeoutMs: 60_000 }
  ) as { positioning_statement: string; signature_lines: string[]; content_strategy_narrative: string };

  return { ...(merged as Partial<PositionStrategy>), ...synthesis } as PositionStrategy;
}
