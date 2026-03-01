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
