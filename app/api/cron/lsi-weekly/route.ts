/**
 * Cron: Weekly LSI Recalculation
 * GET /api/cron/lsi-weekly
 *
 * Runs every Monday at 9am IST via Vercel Cron.
 * Re-derives LSI for all clients who have a completed discover run.
 * Ensures historical trend data stays fresh in lsi_runs.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const startTime = Date.now();

  try {
    // Get all active clients with completed discover runs
    const { data: clients } = await admin
      .from('clients')
      .select('id, name, baseline_lsi, target_lsi')
      .eq('status', 'active');

    if (!clients?.length) {
      return NextResponse.json({ message: 'No active clients', processed: 0 });
    }

    const results: Record<string, unknown>[] = [];

    for (const client of clients) {
      try {
        // Get latest completed discover run
        const { data: discoverRun } = await admin
          .from('discover_runs')
          .select('*')
          .eq('client_id', client.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!discoverRun) {
          results.push({ clientId: client.id, skipped: 'no discover run' });
          continue;
        }

        // Derive inputs and calculate via the LSI calculate API internally
        const lsiRes = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/lsi/calculate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-cron-secret': process.env.CRON_SECRET ?? '',
            },
            body: JSON.stringify({ clientId: client.id }),
          }
        );

        if (!lsiRes.ok) {
          const errData = await lsiRes.json().catch(() => ({}));
          throw new Error(`LSI API failed: ${(errData as Record<string,string>).message ?? lsiRes.status}`);
        }

        const lsiData = await lsiRes.json() as { total: number; components: Record<string, number> };
        const total      = lsiData.total;
        const components = lsiData.components;

        // Get historical scores for stats
        const { data: history } = await admin
          .from('lsi_runs')
          .select('total_score')
          .eq('client_id', client.id)
          .order('run_date', { ascending: true });

        const scores = (history ?? []).map((r: Record<string, unknown>) => Number(r.total_score));
        const mean   = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : total;
        const stddev = scores.length > 1
          ? Math.sqrt(scores.reduce((s: number, x: number) => s + Math.pow(x - mean, 2), 0) / (scores.length - 1))
          : 0;

        // Save new LSI run
        await admin.from('lsi_runs').insert({
          client_id:   client.id,
          total_score: total,
          components,
          stats: { mean, stddev, ucl: mean + 3 * stddev, lcl: Math.max(0, mean - 3 * stddev) },
        });

        // Update client baseline if not set
        if (!client.baseline_lsi) {
          await admin.from('clients').update({ baseline_lsi: total }).eq('id', client.id);
        }

        // Check if LSI dropped significantly (alert)
        if (scores.length > 0) {
          const lastScore = scores[scores.length - 1];
          const drop = lastScore - total;
          if (drop > 5) {
            await admin.from('alerts').insert({
              client_id: client.id,
              type:      'narrative_drift',
              severity:  drop > 10 ? 'critical' : 'warning',
              title:     `LSI Drop: ${(client.name as string) ?? 'Client'}`,
              message:   `LSI decreased by ${drop.toFixed(1)} points (${lastScore.toFixed(1)} → ${total.toFixed(1)}). Review content strategy.`,
              status:    'new',
            });
          }
        }

        results.push({ clientId: client.id, newScore: total, recalculated: true });
      } catch (e) {
        results.push({ clientId: client.id, error: e instanceof Error ? e.message : 'Unknown' });
      }
    }

    return NextResponse.json({
      success:     true,
      processed:   clients.length,
      recalculated: results.filter(r => r.recalculated).length,
      durationMs:  Date.now() - startTime,
      results,
    });
  } catch (err) {
    console.error('[cron/lsi-weekly]', err);
    return NextResponse.json({ error: 'LSI cron failed' }, { status: 500 });
  }
}
