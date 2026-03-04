/**
 * Diagnose Module — 6 LSI Component Agents + 1 Synthesis Agent
 * Each agent analyses one LSI component, produces narrative + actions.
 * Synthesis agent ranks priorities and builds the intervention roadmap.
 */

import { runAgents, runSynthesisAgent, buildClientContext } from '../agents';

export interface DiagnoseInput {
  client: { name: string; role?: string; company?: string; industry?: string; keywords?: string[] };
  lsiComponents: { c1: number; c2: number; c3: number; c4: number; c5: number; c6: number };
  totalScore: number;
  discoverData?: {
    sentiment?: { positive: number; neutral: number; negative: number };
    frames?: Record<string, number>;
    topKeywords?: string[];
    crisisSignals?: string[];
  };
}

export interface ComponentNarrative {
  score: number; maxScore: number; percentage: number;
  classification: string; score_explanation: string;
  strengths: string[]; gaps: string[]; priority_action: string;
}

export interface DiagnoseNarrative {
  component_rationale: Record<string, ComponentNarrative>;
  risk_heatmap: Array<{ dimension: string; current_signal: string; risk_level: string; assessment: string }>;
  identified_strengths: Array<{ title: string; evidence: string; leverage: string }>;
  risk_factors: Array<{ title: string; description: string; urgency: string }>;
  intervention_plan: {
    immediate: Array<{ action: string; rationale: string; expected_impact: string; timeline: string }>;
    medium_term: Array<{ action: string; rationale: string; expected_impact: string; timeline: string }>;
    long_term: Array<{ action: string; rationale: string; expected_impact: string; timeline: string }>;
  };
  peer_comparison: Array<{ name: string; role: string; industry: string; estimated_lsi: number; gap: string; key_differentiator: string }>;
  target_state: Array<{ component: string; current: number; target: number; delta: number; pathway: string }>;
}

const COMPONENT_META = {
  c1: { name: 'Search Reputation',      maxScore: 20, description: 'How you appear in Google/AI search — quality, sentiment, and narrative consistency of top results' },
  c2: { name: 'Media Framing',          maxScore: 20, description: 'How media portrays you — expert citations, tier-1 coverage, bylines, and strategic frame' },
  c3: { name: 'Social Backlash Risk',   maxScore: 20, description: 'Reverse-scored — lower controversy, higher score. Measures crisis exposure and negative sentiment' },
  c4: { name: 'Elite Discourse',        maxScore: 15, description: 'Presence in high-value conversations — board rooms, policy forums, Davos-tier venues' },
  c5: { name: 'Third-Party Validation', maxScore: 15, description: 'External credibility — awards, rankings, endorsements, Wikipedia, academic citations' },
  c6: { name: 'Crisis Moat',            maxScore: 10, description: 'Resilience buffer — depth of positive content to withstand negative events' },
};

export function buildDiagnoseAgents(input: DiagnoseInput) {
  const { client, lsiComponents, totalScore, discoverData } = input;
  const ctx = buildClientContext(client);
  const sys = `You are a Senior LSI (Legitimacy Strength Index) Analyst at a top-tier reputation firm. You are analysing one specific component of the LSI score for ${client.name}.
Be specific, evidence-based, and actionable. Name real publications, real peer executives, real strategies.
Respond with ONLY valid JSON. No markdown.`;

  const componentAgents = Object.entries(lsiComponents).map(([key, score]) => {
    const meta = COMPONENT_META[key as keyof typeof COMPONENT_META];
    const pct = Math.round((score / meta.maxScore) * 100);
    const discoverCtx = discoverData ? `\nDiscover data: sentiment ${discoverData.sentiment?.positive ?? 0}%+ / ${discoverData.sentiment?.neutral ?? 0}% neutral | top keywords: ${discoverData.topKeywords?.slice(0,6).join(', ')}` : '';

    return {
      id: `component_${key}`,
      label: `${meta.name} Agent`,
      maxTokens: 1500,
      systemPrompt: sys,
      userPrompt: `${ctx}${discoverCtx}

LSI Component: ${meta.name} (${key.toUpperCase()})
Description: ${meta.description}
Current Score: ${score}/${meta.maxScore} (${pct}%)
Total LSI: ${totalScore}/100

Analyse this specific component in depth. What does this score mean for ${client.name}? What is causing it? What must change?

Return JSON:
{
  "component_${key}": {
    "score": ${score},
    "maxScore": ${meta.maxScore},
    "percentage": ${pct},
    "classification": "${pct >= 80 ? 'Strong' : pct >= 60 ? 'Moderate' : pct >= 40 ? 'Weak' : 'Critical'}",
    "score_explanation": "2-3 sentences: what does this specific score tell us about ${client.name}'s ${meta.name.toLowerCase()}?",
    "strengths": ["specific strength 1", "specific strength 2"],
    "gaps": ["specific gap 1", "specific gap 2", "specific gap 3"],
    "priority_action": "the single most impactful action to improve this component in 90 days"
  }
}`,
    };
  });

  return componentAgents;
}

export async function runDiagnoseSynthesis(
  componentOutputs: Record<string, unknown>,
  input: DiagnoseInput
): Promise<Pick<DiagnoseNarrative, 'risk_heatmap' | 'identified_strengths' | 'risk_factors' | 'intervention_plan' | 'peer_comparison' | 'target_state'>> {
  const { client, lsiComponents, totalScore } = input;

  return runSynthesisAgent(
    Object.entries(componentOutputs).map(([id, output]) => ({ id, label: id, output: output as Record<string,unknown>, ok: true, durationMs: 0 })),
    {
      systemPrompt: `You are the Lead LSI Strategist synthesising a complete Diagnose Report for ${client.name}.
You have received analysis from 6 specialist agents — one per LSI component.
Your job: Synthesise into the full strategic picture: risk heatmap, strengths, risk factors, intervention roadmap, peer comparison, and 12-month target state.
Be specific, name real peers, give actionable timelines. Respond with ONLY valid JSON.`,
      buildUserPrompt: (outputs) => `Component analysis from 6 agents:\n${JSON.stringify(outputs, null, 2).slice(0, 6000)}\n\nTotal LSI: ${totalScore}/100\nScores: ${Object.entries(lsiComponents).map(([k,v]) => `${COMPONENT_META[k as keyof typeof COMPONENT_META].name}: ${v}/${COMPONENT_META[k as keyof typeof COMPONENT_META].maxScore}`).join(', ')}\n\nReturn JSON:\n{"risk_heatmap":[{"dimension":"e.g. Search Identity","current_signal":"what we observe","risk_level":"High|Moderate-High|Moderate|Low","assessment":"2 sentences"}],"identified_strengths":[{"title":"strength","evidence":"specific evidence","leverage":"how to amplify this"}],"risk_factors":[{"title":"risk","description":"specific description","urgency":"Immediate|Short-term|Medium-term"}],"intervention_plan":{"immediate":[{"action":"specific action","rationale":"why this","expected_impact":"what will change","timeline":"0-30 days"}],"medium_term":[{"action":"specific action","rationale":"why","expected_impact":"what will change","timeline":"1-6 months"}],"long_term":[{"action":"specific action","rationale":"why","expected_impact":"what will change","timeline":"6-18 months"}]},"peer_comparison":[{"name":"Real Executive Name","role":"role at company","industry":"sector","estimated_lsi":72,"gap":"how ${client.name} compares","key_differentiator":"what makes this peer stronger/weaker"}],"target_state":[{"component":"component name","current":${lsiComponents.c1},"target":${Math.min(lsiComponents.c1 + 6, 20)},"delta":6,"pathway":"specific steps to close this gap"}]}`,
    },
    { maxTokens: 3000, timeoutMs: 90_000 }
  ) as Promise<Pick<DiagnoseNarrative, 'risk_heatmap' | 'identified_strengths' | 'risk_factors' | 'intervention_plan' | 'peer_comparison' | 'target_state'>>;
}

export async function generateDiagnoseNarrativeAgentically(input: DiagnoseInput): Promise<DiagnoseNarrative> {
  console.log('[Diagnose Agents] Starting 6 component agents for', input.client.name);
  const agents = buildDiagnoseAgents(input);
  const { merged, totalDurationMs, failedAgents } = await runAgents(agents);
  console.log(`[Diagnose Agents] 6 agents done in ${totalDurationMs}ms. Failed: ${failedAgents.join(',') || 'none'}`);

  const synthesis = await runDiagnoseSynthesis(merged as Record<string,unknown>, input);

  // Build component_rationale from merged outputs
  const componentRationale: Record<string, ComponentNarrative> = {};
  for (const key of Object.keys(input.lsiComponents)) {
    const agentOutput = (merged as Record<string, Record<string, ComponentNarrative>>)[`component_${key}`];
    if (agentOutput) componentRationale[key] = agentOutput[`component_${key}` as keyof typeof agentOutput] as unknown as ComponentNarrative;
  }

  return { component_rationale: componentRationale, ...synthesis };
}
