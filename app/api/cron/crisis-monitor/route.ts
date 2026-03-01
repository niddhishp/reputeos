/**
 * Cron: Crisis Monitor
 * GET /api/cron/crisis-monitor
 *
 * Runs every 4 hours via Vercel Cron.
 * Checks all active clients for: sentiment drops, volume spikes, crisis keywords.
 * Inserts alert records if thresholds breached → triggers Shield real-time feed.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const CRISIS_KEYWORDS = [
  'scandal', 'controversy', 'fraud', 'lawsuit', 'arrested', 'convicted',
  'SEBI', 'ED', 'CBI', 'notice', 'probe', 'investigation', 'misconduct',
  'fired', 'resigned', 'forced out', 'allegations', 'harassment', 'scam',
];

// Verify request comes from Vercel Cron (or our own test header)
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // dev mode
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const startTime = Date.now();

  try {
    // Get all active clients
    const { data: clients, error: clientErr } = await admin
      .from('clients')
      .select('id, name')
      .eq('status', 'active');

    if (clientErr || !clients?.length) {
      return NextResponse.json({ message: 'No active clients', processed: 0 });
    }

    const results: Record<string, unknown>[] = [];

    for (const client of clients) {
      try {
        const clientResult = await monitorClient(admin, client.id, client.name as string);
        results.push(clientResult);
      } catch (e) {
        results.push({ clientId: client.id, error: e instanceof Error ? e.message : 'Unknown' });
      }
    }

    return NextResponse.json({
      success: true,
      processed: clients.length,
      alertsGenerated: results.filter(r => r.alertCreated).length,
      durationMs: Date.now() - startTime,
      results,
    });
  } catch (err) {
    console.error('[cron/crisis-monitor]', err);
    return NextResponse.json({ error: 'Monitor failed' }, { status: 500 });
  }
}

async function monitorClient(admin: ReturnType<typeof createAdminClient>, clientId: string, clientName: string) {
  // Get last 2 discover runs to compare
  const { data: runs } = await admin
    .from('discover_runs')
    .select('total_mentions, sentiment_dist, mentions, created_at')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(2);

  if (!runs || runs.length === 0) {
    return { clientId, skipped: 'no discover runs' };
  }

  const latest   = runs[0];
  const previous = runs[1] ?? null;

  const latestMentions   = latest.total_mentions as number ?? 0;
  const previousMentions = (previous?.total_mentions as number) ?? latestMentions;

  const sentimentDist = latest.sentiment_dist as Record<string, number> ?? {};
  const negativePct   = sentimentDist.negative ?? 0;
  const positivePct   = sentimentDist.positive ?? 0;

  // ── Crisis detection heuristics ─────────────────────────────────────────
  const volumeSpike   = previousMentions > 0 && latestMentions > previousMentions * 2.5;
  const sentimentDrop = negativePct > 40;
  const lowPositive   = positivePct < 30 && latestMentions > 10;

  // Check crisis keywords in mention snippets
  const mentions = (latest.mentions as Array<{ snippet?: string }>) ?? [];
  const crisisKeywordsFound = mentions.some(m =>
    CRISIS_KEYWORDS.some(kw => (m.snippet ?? '').toLowerCase().includes(kw.toLowerCase()))
  );

  const hasCrisis = volumeSpike || sentimentDrop || crisisKeywordsFound;
  const hasWarning = lowPositive;

  if (!hasCrisis && !hasWarning) {
    return { clientId, alertCreated: false, status: 'clean' };
  }

  // Build alert
  const severity = (crisisKeywordsFound || (volumeSpike && sentimentDrop)) ? 'critical' : 'warning';
  const triggers: string[] = [];
  if (volumeSpike)         triggers.push(`Volume spike: ${latestMentions}x (was ${previousMentions})`);
  if (sentimentDrop)       triggers.push(`High negative sentiment: ${negativePct}%`);
  if (crisisKeywordsFound) triggers.push('Crisis keywords detected in mentions');
  if (lowPositive)         triggers.push(`Low positive sentiment: ${positivePct}%`);

  const { error: alertErr } = await admin.from('alerts').insert({
    client_id: clientId,
    type:      crisisKeywordsFound ? 'crisis' : volumeSpike ? 'volume_spike' : 'sentiment_drop',
    severity,
    title:     severity === 'critical' ? `⚡ Crisis Risk: ${clientName}` : `⚠ Reputation Alert: ${clientName}`,
    message:   triggers.join(' · '),
    trigger_data: {
      latestMentions,
      previousMentions,
      negativePct,
      positivePct,
      crisisKeywordsFound,
      volumeSpike,
    },
    status: 'new',
  });

  if (alertErr) throw new Error(`Alert insert failed: ${alertErr.message}`);

  return { clientId, alertCreated: true, severity, triggers };
}
