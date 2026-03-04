/**
 * LSI Calculation API Route
 *
 * TWO MODES:
 *  1. AUTO (recommended): POST { clientId }
 *     Pulls latest discover_run, derives component inputs automatically, saves.
 *
 *  2. MANUAL: POST { clientId, inputs: { c1, c2, c3, c4, c5, c6 } }
 *     Accepts explicit component inputs (for manual override/testing).
 */

import { z } from 'zod';
import { createClient, createAdminClient, verifyClientOwnership } from '@/lib/supabase/server';
import {
  calculateLSI,
  calculateStats,
  calculateGaps,
  LSIComponents,
} from '@/lib/lsi/calculator';
import { deriveInputsFromDiscover } from '@/lib/lsi/from-discover';

const AutoSchema = z.object({
  clientId: z.string().uuid(),
  mode: z.literal('auto').optional(),
});

const ManualSchema = z.object({
  clientId: z.string().uuid(),
  mode: z.literal('manual'),
  inputs: z.object({
    c1: z.object({ positiveResults: z.number(), totalResults: z.number(), knowledgePanelPresent: z.boolean(), wikipediaPresent: z.boolean(), negativeContentRatio: z.number() }),
    c2: z.object({ positiveMentions: z.number(), totalMentions: z.number(), tier1Mentions: z.number(), expertQuotes: z.number(), narrativeConsistency: z.number() }),
    c3: z.object({ positiveSentiment: z.number(), neutralSentiment: z.number(), negativeSentiment: z.number(), mentionVolume: z.number(), engagementRate: z.number(), crisisResponseTime: z.number().optional() }),
    c4: z.object({ peerMentions: z.number(), leaderEndorsements: z.number(), speakingInvitations: z.number(), citations: z.number() }),
    c5: z.object({ awards: z.number(), analystMentions: z.number(), rankingLists: z.number(), certifications: z.number() }),
    c6: z.object({ crisesHandled: z.number(), crisesRecovered: z.number(), proactiveNarratives: z.number(), trustIndex: z.number(), recoverySpeed: z.number() }),
  }),
});

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Detect mode
  const bodyObj = body as Record<string, unknown>;
  const isManual = bodyObj?.mode === 'manual';

  const parsed = isManual
    ? ManualSchema.safeParse(body)
    : AutoSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 });
  }

  const { clientId } = parsed.data;
  const isOwner = await verifyClientOwnership(clientId);
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 });

  // ── AUTO MODE: derive inputs from latest discover_run ──────────────────────
  let inputs: ReturnType<typeof deriveInputsFromDiscover>;

  if (!isManual) {
    const { data: run, error: runErr } = await supabase
      .from('discover_runs')
      .select('total_mentions, sentiment_dist, frame_dist, top_keywords, mentions, archetype_hints, crisis_signals, analysis_summary, lsi_preliminary')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (runErr || !run) {
      return Response.json({
        error: 'No completed scan found',
        message: 'Run Discover first to generate scan data for LSI calculation.',
      }, { status: 422 });
    }

    // If AI already calculated a preliminary LSI during scan and it's recent enough,
    // we still recalculate using the proper formulas for accuracy
    inputs = deriveInputsFromDiscover(run as Parameters<typeof deriveInputsFromDiscover>[0]);
  } else {
    inputs = (parsed.data as z.infer<typeof ManualSchema>).inputs as ReturnType<typeof deriveInputsFromDiscover>;
  }

  // ── CALCULATE ──────────────────────────────────────────────────────────────
  const result = calculateLSI(inputs);

  // ── HISTORICAL STATS ───────────────────────────────────────────────────────
  const { data: history } = await supabase
    .from('lsi_runs')
    .select('total_score')
    .eq('client_id', clientId)
    .order('run_date', { ascending: false })
    .limit(12);

  const historicalScores = [result.totalScore, ...(history?.map(r => r.total_score) ?? [])];
  const stats = calculateStats(historicalScores);

  const defaultTargets: LSIComponents = { c1: 16, c2: 16, c3: 16, c4: 12, c5: 12, c6: 8 };
  const gaps = calculateGaps(result.components, defaultTargets);

  // ── SAVE ───────────────────────────────────────────────────────────────────
  const admin = createAdminClient();
  const { data: lsiRun, error: saveErr } = await admin
    .from('lsi_runs')
    .insert({
      client_id: clientId,
      run_date: new Date().toISOString(),
      total_score: result.totalScore,
      components: result.components,
      stats,
      gaps,
      inputs: isManual ? inputs : { derivedFromDiscover: true },
    })
    .select()
    .single();

  if (saveErr) {
    return Response.json({ error: 'Failed to save', message: saveErr.message }, { status: 500 });
  }

  // Update client baseline_lsi if not set
  const { data: client } = await supabase.from('clients').select('baseline_lsi').eq('id', clientId).single();
  if (!client?.baseline_lsi) {
    await admin.from('clients').update({
      baseline_lsi: result.totalScore,
      updated_at: new Date().toISOString(),
    }).eq('id', clientId);
  }

  // ── NARRATIVE GENERATION (non-blocking) ───────────────────────────────────
  // Fire off AI narrative generation after saving score — doesn't block response
  generateNarrative(lsiRun.id, clientId, result, gaps, admin).catch(e =>
    console.warn('[ReputeOS] Narrative generation failed:', e.message)
  );

  return Response.json({
    success: true,
    lsiRun: {
      id: lsiRun.id,
      totalScore: result.totalScore,
      percentage: result.percentage,
      classification: result.classification,
      components: result.components,
      stats,
      gaps,
    },
  });
}

// ── Narrative Generator ─────────────────────────────────────────────────────
async function generateNarrative(
  lsiRunId: string,
  clientId: string,
  result: ReturnType<typeof calculateLSI>,
  gaps: ReturnType<typeof calculateGaps>,
  admin: ReturnType<typeof createAdminClient>
): Promise<void> {
  const key = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!key) return;

  // Fetch context for narrative
  const supabaseInner = await createClient();
  const [{ data: client }, { data: discoverRun }, { data: positioning }] = await Promise.all([
    supabaseInner.from('clients').select('name,company,role,industry,keywords').eq('id', clientId).single(),
    supabaseInner.from('discover_runs').select('total_mentions,sentiment_summary,frame_distribution,top_keywords,archetype_hints,crisis_signals,analysis_summary').eq('client_id', clientId).eq('status','completed').order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabaseInner.from('positioning').select('personal_archetype,business_archetype,followability_score,positioning_statement').eq('client_id', clientId).maybeSingle(),
  ]);

  if (!client) return;

  const ctx = {
    name: client.name,
    company: client.company ?? '',
    role: client.role ?? '',
    industry: client.industry ?? '',
    lsiScore: result.totalScore,
    classification: result.classification,
    components: result.components,
    gaps: gaps.slice(0, 3),
    totalMentions: discoverRun?.total_mentions ?? 0,
    sentiment: discoverRun?.sentiment_summary ?? {},
    frames: discoverRun?.frame_distribution ?? {},
    keywords: discoverRun?.top_keywords ?? [],
    archetypeHints: discoverRun?.archetype_hints ?? [],
    crisisSignals: discoverRun?.crisis_signals ?? [],
    archetype: positioning?.personal_archetype ?? '',
  };

  const systemPrompt = `You are a senior reputation strategist at a top PR firm. 
You analyse digital reputation data and write SPECIFIC, EVIDENCE-BASED insights.
Never write generic advice. Always reference actual data from the context.
Always respond with valid JSON matching the requested schema exactly.`;

  const COMPONENT_NAMES: Record<string, string> = {
    c1: 'Search Reputation', c2: 'Media Framing', c3: 'Social Backlash Resistance',
    c4: 'Elite Discourse', c5: 'Third-Party Validation', c6: 'Crisis Moat'
  };
  const COMPONENT_MAX: Record<string, number> = { c1:20, c2:20, c3:20, c4:15, c5:15, c6:10 };

  const componentLines = Object.entries(ctx.components)
    .map(([k,v]) => `${COMPONENT_NAMES[k]}: ${v}/${COMPONENT_MAX[k]}`)
    .join(', ');

  const frameTop = Object.entries(ctx.frames as Record<string,number>)
    .sort(([,a],[,b])=>b-a).slice(0,3)
    .map(([k,v])=>`${k}:${v}%`).join(', ');

  // ── Prompt 1: Component rationale + Risk heatmap + Strengths + Risks ─────
  const prompt1 = `Client: ${ctx.name}, ${ctx.role} at ${ctx.company} (${ctx.industry})
LSI Score: ${ctx.lsiScore}/100 — ${ctx.classification}
Components: ${componentLines}
Total mentions: ${ctx.totalMentions} | Sentiment: ${JSON.stringify(ctx.sentiment)}
Frame distribution: ${frameTop}
Top keywords: ${(ctx.keywords as string[]).slice(0,8).join(', ')}
Archetype signals from AI: ${(ctx.archetypeHints as string[]).join(', ')}
Crisis signals: ${(ctx.crisisSignals as string[]).length > 0 ? (ctx.crisisSignals as string[]).join('; ') : 'None detected'}

Generate a JSON object with these exact keys:

{
  "component_rationale": {
    "c1": { "score_explanation": "2 sentences explaining why this score — cite actual data", "strengths": ["specific strength 1"], "gaps": ["specific gap 1", "specific gap 2"], "priority_action": "one specific action to improve this score" },
    "c2": { ... same structure ... },
    "c3": { ... },
    "c4": { ... },
    "c5": { ... },
    "c6": { ... }
  },
  "risk_heatmap": [
    { "dimension": "Professional Identity", "current_signal": "brief description", "risk_level": "LOW|MODERATE|HIGH", "assessment": "one sentence" },
    { "dimension": "Thought Leadership", "current_signal": "...", "risk_level": "...", "assessment": "..." },
    { "dimension": "Independent Expert Frame", "current_signal": "...", "risk_level": "...", "assessment": "..." },
    { "dimension": "Crisis Resilience", "current_signal": "...", "risk_level": "...", "assessment": "..." },
    { "dimension": "Social Presence", "current_signal": "...", "risk_level": "...", "assessment": "..." },
    { "dimension": "Personal Narrative", "current_signal": "...", "risk_level": "...", "assessment": "..." }
  ],
  "identified_strengths": [
    { "title": "Short title", "description": "2 sentences with specific evidence from data" }
  ],
  "risk_factors": [
    { "title": "Short risk title", "description": "2 sentences explaining the risk with specifics" }
  ]
}

Use ${ctx.name}'s actual data. Be specific, not generic. Return ONLY the JSON object.`;

  // ── Prompt 2: Intervention plan + Peer comparison + Target state ──────────
  const prompt2 = `Client: ${ctx.name}, ${ctx.role} at ${ctx.company} (${ctx.industry})
LSI Score: ${ctx.lsiScore}/100 | Top gaps: ${ctx.gaps.map((g: {component: string; gap: number}) => `${g.component}(${g.gap}pts)`).join(', ')}
Archetype: ${ctx.archetype || (ctx.archetypeHints as string[])[0] || 'TBD'}

Generate a JSON object with these exact keys:

{
  "intervention_plan": {
    "immediate": [
      { "action": "specific action title", "detail": "2 sentence explanation", "impact": "expected outcome" }
    ],
    "medium_term": [ ... same structure, 2-3 items ... ],
    "long_term": [ ... same structure, 2-3 items ... ]
  },
  "peer_comparison": [
    { "name": "Peer Name", "company": "Company", "primary_narrative": "their positioning", "lsi_estimate": 75, "india_presence": "Low|Moderate|High", "personal_story": "Low|Moderate|High" }
  ],
  "target_state": {
    "timeframe": "12 months",
    "target_lsi": ${Math.min(ctx.lsiScore + 22, 85)},
    "metrics": [
      { "metric": "LSI Score", "current": "${ctx.lsiScore}", "target": "${Math.min(ctx.lsiScore + 22, 85)}", "delta": "+${Math.min(22, 85-ctx.lsiScore)}" },
      { "metric": "LinkedIn Followers", "current": "estimate from context", "target": "target", "delta": "+X%" },
      { "metric": "Media Mentions/Year", "current": "${ctx.totalMentions}", "target": "target", "delta": "+X%" },
      { "metric": "Keynotes/Year", "current": "estimate", "target": "target", "delta": "+X" },
      { "metric": "Expert Quotes/Year", "current": "estimate", "target": "target", "delta": "+X%" },
      { "metric": "Published Op-Eds", "current": "estimate", "target": "12-15", "delta": "+X%" }
    ]
  }
}

Peers should be REAL named executives in the same industry (${ctx.industry}) as ${ctx.name}.
Return ONLY the JSON object.`;

  async function callOpenRouter(prompt: string): Promise<unknown> {
    const baseUrl = process.env.OPENROUTER_API_KEY
      ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
    const model = process.env.OPENROUTER_API_KEY
      ? 'anthropic/claude-3.5-sonnet' : 'gpt-4o-mini';
    const headers: Record<string,string> = process.env.OPENROUTER_API_KEY ? {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://reputeos.com',
    } : {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    };
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST', headers,
      body: JSON.stringify({
        model, max_tokens: 3000, temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return JSON.parse(data.choices[0]?.message?.content ?? '{}');
  }

  // Run both prompts in parallel
  const [part1, part2] = await Promise.allSettled([
    callOpenRouter(prompt1),
    callOpenRouter(prompt2),
  ]);

  const p1 = part1.status === 'fulfilled' ? part1.value as Record<string,unknown> : {};
  const p2 = part2.status === 'fulfilled' ? part2.value as Record<string,unknown> : {};

  // Update lsi_run with narrative
  await admin.from('lsi_runs').update({
    component_rationale: p1.component_rationale ?? null,
    risk_heatmap:        p1.risk_heatmap ?? null,
    identified_strengths:p1.identified_strengths ?? null,
    risk_factors:        p1.risk_factors ?? null,
    intervention_plan:   p2.intervention_plan ?? null,
    peer_comparison:     p2.peer_comparison ?? null,
    target_state:        p2.target_state ?? null,
  }).eq('id', lsiRunId);
}

export async function GET(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = new URL(request.url).searchParams.get('clientId');
  if (!clientId) return Response.json({ error: 'clientId required' }, { status: 400 });

  const isOwner = await verifyClientOwnership(clientId);
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { data: runs, error } = await supabase
    .from('lsi_runs')
    .select('*')
    .eq('client_id', clientId)
    .order('run_date', { ascending: false })
    .limit(24);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, runs });
}
