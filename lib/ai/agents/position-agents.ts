/**
 * Position Module — 4 Parallel Agents + 1 Synthesis Agent
 *
 * SYS is domain-agnostic: works for executives, creators, academics, artists, etc.
 * Archetype list uses intellectual identity labels, not Jung archetypes.
 */
import { runAgents, runSynthesisAgent, buildClientContext } from '../agents';

export interface PositionInput {
  client: { name: string; role?: string; company?: string; industry?: string; keywords?: string[] };
  archetypes: { personal: string; business?: string };
  discoverData?: { topKeywords?: string[]; frames?: Record<string, number>; crisisSignals?: string[] };
  lsiScore?: number;
}

export interface PositionStrategy {
  archetype_analysis: {
    primary_archetype: string;
    secondary_archetype: string;
    voice_profile: string;
    intellectual_territory: string;
    why_this_fits: string;
    risks_if_misaligned: string;
  };
  followability_analysis: {
    score: number;
    interpretation: string;
    strength_drivers: string[];
    limiting_factors: string[];
    peer_benchmarks: string[];
    improvement_levers: string[];
  };
  content_pillars: Array<{
    pillar_name: string;
    territory_definition: string;
    why_it_matters: string;
    content_formats: string[];
  }>;
  influencer_intelligence: Array<{
    name: string;
    domain: string;
    why_relevant: string;
    content_dna: string;
    key_lesson_for_subject: string;
  }>;
  positioning_statement: string;
  signature_lines: string[];
  content_strategy_narrative: string;
}

const SYS = (name: string) => `
You are a Senior Strategic Positioning Analyst operating inside a professional reputation intelligence and thought-leadership strategy platform.

Your responsibility is to analyse and design the strategic foundation for the public intellectual or professional positioning of:
Subject: ${name}

The subject may belong to ANY professional domain — business, technology, research, media, creative industries, academia, policy, entrepreneurship, design, culture, science, social impact, investment, or innovation ecosystems.

You must NOT assume the subject is an executive.
They may be a creator, founder, scholar, strategist, artist, technologist, operator, thinker, or domain specialist.

Your role is to identify how this person should be positioned as a credible voice within their domain.

Your analysis must be:
• strategic
• evidence-aware
• intellectually rigorous
• non-generic
• realistic
• respectful in tone

Avoid hype, flattery, or vague advice.
Focus on: distinctive intellectual positioning, credibility signals, thought leadership architecture, narrative clarity, influence mechanics, content leverage strategies.

ANTI-HALLUCINATION RULES:
You must NOT invent: publications, awards, speaking events, partnerships, follower counts, organisations, credentials, books, podcasts, or interviews.
Only refer to specific individuals, platforms, or publications when they are widely recognised in the relevant domain.
If you cannot identify appropriate references, leave those arrays empty.

Respond ONLY with valid JSON. No markdown, no commentary outside JSON.
`.trim();

export function buildPositionAgents(input: PositionInput) {
  const { client, archetypes, discoverData, lsiScore } = input;
  const ctx = buildClientContext(client);
  const archetypeCtx = `Archetype: ${archetypes.personal}${archetypes.business ? ` + ${archetypes.business}` : ''}`;
  const discoverCtx = discoverData
    ? `\nDiscover signals: keywords: ${discoverData.topKeywords?.slice(0, 8).join(', ')} | crisis: ${discoverData.crisisSignals?.join('; ') || 'none'}`
    : '';
  const sys = SYS(client.name);

  return [

    /* ── AGENT 1: Archetype Analysis ─────────────────────────────────── */
    {
      id: 'archetype_analysis',
      label: 'Archetype Analyst Agent',
      maxTokens: 1500,
      fallback: {
        archetype_analysis: {
          primary_archetype: archetypes.personal,
          secondary_archetype: archetypes.business ?? 'None assigned',
          voice_profile: 'Analysis pending — rescan to generate.',
          intellectual_territory: 'Analysis pending.',
          why_this_fits: 'Analysis pending.',
          risks_if_misaligned: 'Analysis pending.',
        },
      },
      systemPrompt: `${sys}\n\nYour job: Analyse the authentic thought-leadership archetype for the subject. The archetype defines how they should show up intellectually in public discourse. Do NOT assign archetypes randomly — base analysis on professional background, intellectual orientation, behavioural signals, domain positioning, and narrative tone.

Possible archetypes:
• The Systems Thinker — sees patterns across disciplines
• The Builder — documents what they've made and why
• The Research Interpreter — translates complex findings for practitioners
• The Industry Decoder — demystifies sector dynamics for outsiders
• The Cultural Observer — reads signals in shifts and trends
• The Operator-Practitioner — shares earned insight from doing
• The Framework Creator — packages thinking into replicable models
• The Futurist — projects trajectories credibly
• The Contrarian — challenges consensus with evidence
• The Synthesiser — bridges multiple domains into new insight

Avoid generic labels like "thought leader" — focus on intellectual identity.`,
      userPrompt: `${ctx}\n${archetypeCtx}${discoverCtx}\nLSI: ${lsiScore ?? 'unknown'}/100\n\nReturn JSON:\n{"archetype_analysis":{"primary_archetype":"archetype name","secondary_archetype":"supporting archetype or 'None'","voice_profile":"the authentic voice style — tone, register, style in 2 sentences","intellectual_territory":"the specific territory this archetype allows them to own","why_this_fits":"2-3 sentences: why this archetype is authentic to their background and domain","risks_if_misaligned":"what breaks down if they drift from this archetype"}}`,
    },

    /* ── AGENT 2: Followability Prediction ───────────────────────────── */
    {
      id: 'followability_analysis',
      label: 'Followability Predictor Agent',
      maxTokens: 1200,
      fallback: {
        followability_analysis: {
          score: 0,
          interpretation: 'Analysis pending.',
          strength_drivers: [],
          limiting_factors: ['Insufficient data for analysis'],
          peer_benchmarks: [],
          improvement_levers: [],
        },
      },
      systemPrompt: `${sys}\n\nYour job: Estimate the followability potential of the subject's public voice. Followability = the probability that people would choose to repeatedly consume this person's ideas.

Evaluate across five factors:
1. Intellectual clarity — are their ideas easy to grasp and remember?
2. Distinctiveness of perspective — do they say things others don't?
3. Narrative relatability — does their story connect to an audience?
4. Authority signals — what credibility markers exist?
5. Content sustainability — can they produce ideas consistently?

Benchmark against credible voices in their domain. Do NOT fabricate follower counts or statistics. Compare conceptual positioning only.`,
      userPrompt: `${ctx}\n${archetypeCtx}${discoverCtx}\n\nReturn JSON:\n{"followability_analysis":{"score":0,"interpretation":"one sentence: what this score means for their growth potential","strength_drivers":["specific driver 1","specific driver 2"],"limiting_factors":["specific limiter 1","specific limiter 2"],"peer_benchmarks":["Real Person Name — why they are a relevant benchmark"],"improvement_levers":["specific lever to increase followability"]}}`,
    },

    /* ── AGENT 3: Content Pillars ─────────────────────────────────────── */
    {
      id: 'content_pillars',
      label: 'Content Strategy Agent',
      maxTokens: 2500,
      fallback: {
        content_pillars: [
          { pillar_name: 'Analysis pending', territory_definition: 'Rescan to generate.', why_it_matters: '', content_formats: [] },
        ],
      },
      systemPrompt: `${sys}\n\nYour job: Design the intellectual content architecture for the subject as a set of strategic content pillars.

Each pillar represents a durable intellectual territory they can repeatedly explore. Content should be organised — not random posts.

Pillars must be:
• specific and distinctive — not generic
• defensible — hard for others to credibly claim
• aligned with their archetype
• relevant to their domain

Avoid generic pillars like: motivation, productivity, leadership, innovation.

Each pillar must define a clear intellectual theme that enables multiple future pieces and reinforces their narrative positioning.`,
      userPrompt: `${ctx}\n${archetypeCtx}${discoverCtx}\n\nDesign 4-5 specific content pillars for ${client.name}.\n\nReturn JSON:\n{"content_pillars":[{"pillar_name":"specific name — not generic","territory_definition":"precise description of what intellectual space this covers","why_it_matters":"why this pillar is strategic and ownable for this person","content_formats":["LinkedIn long-form","Op-ed","Thread","etc"]}]}`,
    },

    /* ── AGENT 4: Influencer Intelligence ────────────────────────────── */
    {
      id: 'influencer_intelligence',
      label: 'Influencer Intelligence Agent',
      maxTokens: 2000,
      fallback: {
        influencer_intelligence: [],
      },
      systemPrompt: `${sys}\n\nYour job: Identify credible domain voices whose intellectual content DNA the subject should study. These are NOT celebrities — they are respected thinkers, practitioners, analysts, or creators who have successfully built influence in a specific domain.

Select individuals who demonstrate:
• clear intellectual positioning
• consistent content themes
• strong audience resonance
• credible authority signals

Focus on content architecture and narrative identity, not popularity. Only name real, verifiable people. Leave array empty if you cannot identify appropriate individuals.`,
      userPrompt: `${ctx}\n${archetypeCtx}${discoverCtx}\n\nIdentify 5-7 real domain voices whose content DNA ${client.name} should study.\n\nReturn JSON:\n{"influencer_intelligence":[{"name":"Real Person Name only","domain":"their specific domain","why_relevant":"why their approach is relevant to this subject","content_dna":"how they structure their ideas — format, tone, structure, frequency","key_lesson_for_subject":"one specific thing to learn and adapt"}]}`,
    },

  ];
}

export async function generatePositionStrategyAgentically(input: PositionInput): Promise<PositionStrategy> {
  console.log('[Position Agents] Starting 4 parallel agents for', input.client.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents = buildPositionAgents(input) as any[];
  const { merged, totalDurationMs, failedAgents } = await runAgents(agents);
  console.log(`[Position Agents] Done in ${totalDurationMs}ms. Failed: ${failedAgents.join(',') || 'none'}`);

  const synthesis = await runSynthesisAgent(
    Object.entries(merged as Record<string, unknown>).map(([id, output]) => ({
      id, label: id, output: output as Record<string, unknown>, ok: true, durationMs: 0,
    })),
    {
      systemPrompt: `You are synthesising a complete positioning strategy for ${input.client.name}. Based on archetype analysis, followability prediction, content pillars, and influencer mapping, produce the core positioning statement, signature lines, and strategy narrative. Respond with ONLY valid JSON.`,
      buildUserPrompt: (outputs) =>
        `Strategy intelligence:\n${JSON.stringify(outputs, null, 2).slice(0, 5000)}\n\nReturn JSON:\n{"positioning_statement":"one paragraph: who ${input.client.name} is, what they stand for, and why they matter — written as an internal strategic brief, not a public bio","signature_lines":["a punchy 10-15 word line they could use anywhere","second signature line","third signature line"],"content_strategy_narrative":"2-3 sentences: the overarching content strategy rationale — why this approach, for which audience, toward what goal"}`,
    },
    { maxTokens: 1000, timeoutMs: 60_000 }
  ) as { positioning_statement: string; signature_lines: string[]; content_strategy_narrative: string };

  return { ...(merged as Partial<PositionStrategy>), ...synthesis } as PositionStrategy;
}
