/**
 * Diagnose Module — 6 LSI Component Agents + 1 Synthesis Agent
 *
 * Each agent is a specialist LSI analyst evaluating one component.
 * Synthesis agent builds the full strategic diagnosis + intervention roadmap.
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
  component_name: string;
  current_score_estimate: number;
  score_rationale: string;
  evidence_signals: string[];
  missing_signals: string[];
  peer_benchmark: { peer_examples: string[]; comparison_summary: string };
  strategic_implications: string;
  recommended_actions: string[];
}

export interface DiagnoseNarrative {
  component_rationale: Record<string, ComponentNarrative>;
  diagnose_report: {
    overall_lsi_position: { current_state: string; strategic_summary: string };
    risk_heatmap: Array<{ component: string; current_strength: string; risk_level: string; strategic_note: string }>;
    strengths: Array<{ title: string; description: string; why_it_matters: string }>;
    risk_factors: Array<{ title: string; description: string; consequence_if_unaddressed: string }>;
    peer_comparison: { peer_examples: string[]; comparative_position: string; comparison_summary: string };
    intervention_roadmap: {
      immediate_0_3_months: Array<{ action: string; objective: string; lsi_component_impacted: string; success_signal: string }>;
      near_term_3_6_months: Array<{ action: string; objective: string; lsi_component_impacted: string; success_signal: string }>;
      strategic_build_6_12_months: Array<{ action: string; objective: string; lsi_component_impacted: string; success_signal: string }>;
    };
    target_state_12_months: {
      positioning_outcome: string;
      credibility_outcome: string;
      visibility_outcome: string;
      authority_outcome: string;
    };
  };
}

const COMPONENT_META = {
  c1: { name: 'Search Reputation',      maxScore: 20, description: 'How you appear in Google/AI search — quality, sentiment, and narrative consistency of top results' },
  c2: { name: 'Media Framing',          maxScore: 20, description: 'How media portrays you — expert citations, tier-1 coverage, bylines, and strategic frame' },
  c3: { name: 'Social Backlash Risk',   maxScore: 20, description: 'Reverse-scored — lower controversy, higher score. Measures crisis exposure and negative sentiment' },
  c4: { name: 'Elite Discourse',        maxScore: 15, description: 'Presence in high-value conversations — board rooms, policy forums, Davos-tier venues' },
  c5: { name: 'Third-Party Validation', maxScore: 15, description: 'External credibility — awards, rankings, endorsements, Wikipedia, academic citations' },
  c6: { name: 'Crisis Moat',            maxScore: 10, description: 'Resilience buffer — depth of positive content to withstand negative events' },
};

const COMPONENT_SYS = (clientName: string) => `
You are a Senior LSI (Legitimacy Strength Index) Analyst working inside a professional reputation intelligence platform.

You operate at the level of analysts working in top-tier reputation, risk, and strategic advisory firms.

Your responsibility is to evaluate ONE specific component of the Legitimacy Strength Index (LSI) for:
Subject: ${clientName}

The LSI measures how strongly a person's professional identity, authority signals, and public credibility are supported by independent evidence in the public domain.

Your role is NOT to generate content. Your role is structured reputation analysis grounded in verifiable signals.

EVIDENCE RULES:
All claims must be grounded in provided scan results, the verified client profile, clearly established public domain signals, or widely known institutions. You must NEVER invent publications, awards, events, institutions, follower counts, partnerships, positions, or statistics.

If evidence for something is weak or absent, state that clearly:
✔ Correct: "Independent editorial coverage appears limited relative to peers."
✗ Incorrect: "The subject has strong media coverage."

TONE: Analytical, objective, calm, respectful. Frame weaknesses as development areas or under-leveraged signals — not personal failures.

BENCHMARKING: Where appropriate, benchmark against credible peer professionals, common authority signals in their domain, and typical legitimacy indicators for comparable leaders.

Respond with ONLY valid JSON. No markdown, no commentary outside JSON.
`.trim();

export function buildDiagnoseAgents(input: DiagnoseInput) {
  const { client, lsiComponents, totalScore, discoverData } = input;
  const ctx = buildClientContext(client);
  const discoverCtx = discoverData
    ? `\nDiscover signals: sentiment ${discoverData.sentiment?.positive ?? 0}%+ / ${discoverData.sentiment?.neutral ?? 0}% neutral | keywords: ${discoverData.topKeywords?.slice(0, 6).join(', ')}`
    : '';
  const sys = COMPONENT_SYS(client.name);

  return Object.entries(lsiComponents).map(([key, score]) => {
    const meta = COMPONENT_META[key as keyof typeof COMPONENT_META];
    const pct = Math.round((score / meta.maxScore) * 100);
    const classification = pct >= 80 ? 'Strong' : pct >= 60 ? 'Moderate' : pct >= 40 ? 'Weak' : 'Critical';

    return {
      id: `component_${key}`,
      label: `${meta.name} Agent`,
      maxTokens: 1800,
      fallback: {
        [`lsi_component_analysis_${key}`]: {
          component_name: meta.name,
          current_score_estimate: score,
          score_rationale: `Score of ${score}/${meta.maxScore} (${pct}%) — analysis pending.`,
          evidence_signals: [],
          missing_signals: ['Analysis unavailable — please rescan'],
          peer_benchmark: { peer_examples: [], comparison_summary: 'Pending.' },
          strategic_implications: 'Pending.',
          recommended_actions: ['Rescan to generate recommendations'],
        },
      },
      systemPrompt: sys,
      userPrompt: `${ctx}${discoverCtx}

LSI Component: ${meta.name} (${key.toUpperCase()})
Description: ${meta.description}
Current Score: ${score}/${meta.maxScore} (${pct}% — ${classification})
Total LSI: ${totalScore}/100

Analyse this component in depth. Ground your analysis in the client profile and any scan signals. Be specific about what signals exist, what is missing, how this compares to peers, and what would materially improve this score.

Return JSON:
{"lsi_component_analysis":{"component_name":"${meta.name}","current_score_estimate":${score},"score_rationale":"2-3 sentences on what this specific score tells us about ${client.name}'s ${meta.name.toLowerCase()} — grounded in evidence","evidence_signals":["specific signal found — cite source if possible"],"missing_signals":["specific signal that would typically exist for someone at this level but doesn't"],"peer_benchmark":{"peer_examples":["Real comparable professional in similar domain"],"comparison_summary":"1-2 sentences on how ${client.name} compares on this specific component"},"strategic_implications":"paragraph: what does this score mean strategically? What is the practical consequence?","recommended_actions":["specific action to improve this component — not vague, name where, how, what type of output"]}}`,
    };
  });
}

export async function runDiagnoseSynthesis(
  componentOutputs: Record<string, unknown>,
  input: DiagnoseInput
): Promise<{ diagnose_report: DiagnoseNarrative['diagnose_report'] }> {
  const { client, lsiComponents, totalScore } = input;
  const scoresSummary = Object.entries(lsiComponents)
    .map(([k, v]) => `${COMPONENT_META[k as keyof typeof COMPONENT_META].name}: ${v}/${COMPONENT_META[k as keyof typeof COMPONENT_META].maxScore}`)
    .join(', ');

  return runSynthesisAgent(
    Object.entries(componentOutputs).map(([id, output]) => ({
      id, label: id, output: output as Record<string, unknown>, ok: true, durationMs: 0,
    })),
    {
      systemPrompt: `You are the Lead LSI Strategist synthesising a complete Diagnose Report for ${client.name}.

You have received structured analysis from 6 specialist agents, each covering one core LSI component.

Your job is NOT to repeat agent outputs. Integrate them into one coherent strategic diagnosis that explains the overall legitimacy position, strongest assets, most material gaps, peer comparison, and what should be done in the next 12 months.

CRITICAL RULES:
1. Ground all conclusions in agent findings and supplied evidence.
2. Do NOT invent facts, publications, awards, events, follower counts, or credentials.
3. Name only real and relevant peers appropriate to the subject's professional category.
4. If evidence is weak, state that the diagnosis is constrained by available evidence.
5. Frame weaknesses as development areas or under-leveraged signals — not personal failures.
6. Be concrete about timelines, priorities, and sequencing.
7. Do not produce vague advice like "improve visibility" — specify what kind, where, and why.

Identify whether the subject is currently:
• authority-rich but visibility-light
• visible but under-credentialed
• respected in niche circles but not institutionally legitimised
• over-dependent on self-controlled channels
• well-positioned but under-amplified
• exposed to credibility drag from missing third-party validation

Respond with ONLY valid JSON.`,
      buildUserPrompt: (outputs) =>
        `Component analysis from 6 specialists:\n${JSON.stringify(outputs, null, 2).slice(0, 6000)}\n\nTotal LSI: ${totalScore}/100\nScores: ${scoresSummary}\n\nReturn JSON:\n{"diagnose_report":{"overall_lsi_position":{"current_state":"one precise sentence on current legitimacy position","strategic_summary":"2-3 sentences: the complete picture — what is strong, what is weak, what is the core pattern"},"risk_heatmap":[{"component":"component name","current_strength":"Strong|Moderate|Weak","risk_level":"High|Moderate|Low","strategic_note":"1-2 sentences on the specific risk this component poses"}],"strengths":[{"title":"specific strength","description":"evidence-grounded description","why_it_matters":"strategic value of this strength"}],"risk_factors":[{"title":"specific risk","description":"what exactly is the gap or weakness","consequence_if_unaddressed":"what happens in 12 months if nothing changes"}],"peer_comparison":{"peer_examples":["Real comparable professional — domain and role"],"comparative_position":"where ${client.name} sits relative to peers","comparison_summary":"paragraph on competitive legitimacy position"},"intervention_roadmap":{"immediate_0_3_months":[{"action":"specific action","objective":"what this achieves","lsi_component_impacted":"component name","success_signal":"how we know it worked"}],"near_term_3_6_months":[{"action":"specific action","objective":"what this achieves","lsi_component_impacted":"component name","success_signal":"how we know it worked"}],"strategic_build_6_12_months":[{"action":"specific action","objective":"what this achieves","lsi_component_impacted":"component name","success_signal":"how we know it worked"}]},"target_state_12_months":{"positioning_outcome":"what ${client.name} is known for after executing the roadmap","credibility_outcome":"what new legitimacy signals should exist","visibility_outcome":"how search and media perception should shift","authority_outcome":"what new authority markers should be visible"}}}`,
    },
    { maxTokens: 3000, timeoutMs: 90_000 }
  ) as Promise<{ diagnose_report: DiagnoseNarrative['diagnose_report'] }>;
}

export async function generateDiagnoseNarrativeAgentically(input: DiagnoseInput): Promise<DiagnoseNarrative> {
  console.log('[Diagnose Agents] Starting 6 component agents for', input.client.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents = buildDiagnoseAgents(input) as any[];
  const { merged, totalDurationMs, failedAgents } = await runAgents(agents);
  console.log(`[Diagnose Agents] 6 agents done in ${totalDurationMs}ms. Failed: ${failedAgents.join(',') || 'none'}`);

  const synthesis = await runDiagnoseSynthesis(merged as Record<string, unknown>, input);

  // Extract component narratives from agent outputs
  const componentRationale: Record<string, ComponentNarrative> = {};
  for (const key of Object.keys(input.lsiComponents)) {
    const agentOutput = (merged as Record<string, unknown>)[`component_${key}`] as Record<string, unknown> | undefined;
    if (agentOutput?.lsi_component_analysis) {
      componentRationale[key] = agentOutput.lsi_component_analysis as ComponentNarrative;
    }
  }

  return { component_rationale: componentRationale, ...synthesis };
}
