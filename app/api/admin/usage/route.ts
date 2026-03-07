/**
 * GET /api/admin/usage?days=30 — aggregate API usage stats
 */
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10);
    const since = new Date(Date.now() - days * 86400_000).toISOString();

    const [
      { data: usageRows },
      { data: scanRows },
      { data: usageByUser },
      { data: recentErrors },
    ] = await Promise.all([
      // Per-service aggregates
      supabase
        .from('api_usage_log')
        .select('service, tokens_in, tokens_out, cost_usd, status, latency_ms, scan_type')
        .gte('created_at', since),

      // Scan events summary
      supabase
        .from('scan_events')
        .select('scan_type, status, duration_ms, total_cost_usd, user_id, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false }),

      // Per-user usage (top 20)
      supabase
        .from('api_usage_log')
        .select('user_id, cost_usd, tokens_in, tokens_out')
        .gte('created_at', since)
        .not('user_id', 'is', null),

      // Recent errors
      supabase
        .from('api_usage_log')
        .select('service, operation, error_msg, created_at, model')
        .eq('status', 'error')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    // Aggregate by service
    const serviceMap: Record<string, {
      calls: number; errors: number; cost: number; tokens: number; avgLatency: number;
    }> = {};

    for (const row of (usageRows ?? [])) {
      if (!serviceMap[row.service]) {
        serviceMap[row.service] = { calls: 0, errors: 0, cost: 0, tokens: 0, avgLatency: 0 };
      }
      const s = serviceMap[row.service];
      s.calls++;
      if (row.status === 'error') s.errors++;
      s.cost   += row.cost_usd    ?? 0;
      s.tokens += (row.tokens_in ?? 0) + (row.tokens_out ?? 0);
      s.avgLatency += row.latency_ms ?? 0;
    }

    // Finalise avg latency
    for (const s of Object.values(serviceMap)) {
      s.avgLatency = s.calls > 0 ? Math.round(s.avgLatency / s.calls) : 0;
      s.cost = Math.round(s.cost * 10000) / 10000;
    }

    // Per-scan-type summary
    const scanTypeMap: Record<string, { total: number; completed: number; failed: number; cost: number }> = {};
    for (const row of (scanRows ?? [])) {
      if (!scanTypeMap[row.scan_type]) scanTypeMap[row.scan_type] = { total: 0, completed: 0, failed: 0, cost: 0 };
      const s = scanTypeMap[row.scan_type];
      s.total++;
      if (row.status === 'completed') s.completed++;
      if (row.status === 'failed')    s.failed++;
      s.cost += row.total_cost_usd ?? 0;
    }

    // Per-user cost aggregation
    const userCostMap: Record<string, { cost: number; calls: number; tokens: number }> = {};
    for (const row of (usageByUser ?? [])) {
      if (!row.user_id) continue;
      if (!userCostMap[row.user_id]) userCostMap[row.user_id] = { cost: 0, calls: 0, tokens: 0 };
      userCostMap[row.user_id].cost  += row.cost_usd ?? 0;
      userCostMap[row.user_id].calls += 1;
      userCostMap[row.user_id].tokens += (row.tokens_in ?? 0) + (row.tokens_out ?? 0);
    }

    const topUsers = Object.entries(userCostMap)
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 15)
      .map(([userId, stats]) => ({ userId, ...stats, cost: Math.round(stats.cost * 10000) / 10000 }));

    const totalCost = Object.values(serviceMap).reduce((s, v) => s + v.cost, 0);
    const totalCalls = Object.values(serviceMap).reduce((s, v) => s + v.calls, 0);
    const totalTokens = Object.values(serviceMap).reduce((s, v) => s + v.tokens, 0);

    return Response.json({
      period: { days, since },
      summary: {
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalCalls,
        totalTokens,
        errorRate: totalCalls > 0 ? Math.round((Object.values(serviceMap).reduce((s, v) => s + v.errors, 0) / totalCalls) * 100) : 0,
        totalScans: (scanRows ?? []).length,
      },
      byService: serviceMap,
      byScanType: scanTypeMap,
      topUsers,
      recentErrors: (recentErrors ?? []).slice(0, 10),
      recentScans: (scanRows ?? []).slice(0, 15),
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
