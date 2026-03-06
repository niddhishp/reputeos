/**
 * POST /api/lsi/narrative
 * Generates the full Diagnose narrative using 6 parallel LSI component agents + synthesis.
 */
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { generateDiagnoseNarrativeAgentically } from '@/lib/ai/agents/diagnose-agents';
import { z } from 'zod';

export const maxDuration = 300;

const Schema = z.object({ clientId: z.string().uuid(), lsiRunId: z.string().uuid().optional() });

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request): Promise<Response> {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });
  const { clientId, lsiRunId } = parsed.data;

  const db = admin();
  const { data: client } = await db.from('clients')
    .select('name,role,company,industry,keywords').eq('id', clientId).maybeSingle();
  if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

  const query = db.from('lsi_runs').select('*').eq('client_id', clientId);
  const { data: run } = lsiRunId
    ? await query.eq('id', lsiRunId).maybeSingle()
    : await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!run) return Response.json({ error: 'No LSI run found. Calculate LSI first.' }, { status: 404 });

  const { data: discoverRun } = await db.from('discover_runs')
    .select('sentiment_summary,frame_distribution,top_keywords,crisis_signals')
    .eq('client_id', clientId).eq('status', 'completed')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  const components = run.components as Record<string, number> ?? {};

  try {
    const narrative = await generateDiagnoseNarrativeAgentically({
      client: {
        name: client.name, role: client.role ?? '', company: client.company ?? '',
        industry: client.industry ?? '', keywords: (client.keywords as string[]) ?? [],
      },
      lsiComponents: {
        c1: components.c1 ?? 0, c2: components.c2 ?? 0, c3: components.c3 ?? 0,
        c4: components.c4 ?? 0, c5: components.c5 ?? 0, c6: components.c6 ?? 0,
      },
      totalScore: run.total_score ?? 0,
      discoverData: {
        sentiment:     { positive: 0, neutral: 0, negative: 0, ...((discoverRun?.sentiment_summary as Record<string,number>) ?? {}) },
        frames:        (discoverRun?.frame_distribution as Record<string,number>) ?? {},
        topKeywords:   (discoverRun?.top_keywords as string[]) ?? [],
        crisisSignals: (discoverRun?.crisis_signals as string[]) ?? [],
      },
    });

    await db.from('lsi_runs').update({
      component_rationale:  narrative.component_rationale,
      diagnose_report:      narrative.diagnose_report,
    }).eq('id', run.id);

    return Response.json({ success: true, narrative });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[lsi/narrative] Failed:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
